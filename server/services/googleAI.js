const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// USER PROVIDED KEY (Should be moved to process.env.GEMINI_API_KEY in production)
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDHuWy_YAHD1zdJ4mwT0t1_8S0xGr8iDEU";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper to encode file to base64
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

exports.extractDocumentData = async (filePath) => {
    console.log(`[GeminiAI] Processing Document: ${filePath}`);
    try {
        const prompt = "Extract the following details from this Company Registration certificate (MOC) as JSON: companyNameEn, companyNameKh, registrationNumber, incorporationDate, address (province/city). Return ONLY raw JSON, no markdown.";
        const imagePart = fileToGenerativePart(filePath, "image/jpeg");

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("Gemini API Error (Doc):", error);
        return { rawText: "Error extracting data." };
    }
};

exports.extractBankStatement = async (filePath) => {
    console.log(`[GeminiAI] Scanning Bank Statement: ${filePath}`);

    try {
        const prompt = `
            Analyze this Bank Statement image.
            Extract all transaction rows into a strict JSON Array.
            
            JSON Schema:
            [
              {
                "date": "Feb 10, 2025",
                "description": "Transaction details...",
                "moneyIn": 100.50, // number or 0
                "moneyOut": 0,    // number or 0
                "balance": "1,200.00" // string
              }
            ]

            Rules:
            - If moneyIn/Out is empty/dash, use 0.
            - Remove currency symbols ($).
            - Output ONLY the JSON Array. No Markdown. No Explanations.
        `;

        // Robust Mimetype Detection
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.webp') mimeType = 'image/webp';

        const filePart = fileToGenerativePart(filePath, mimeType);

        const result = await model.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        console.log("[GeminiAI] Raw Output Length:", text.length);
        const data = cleanAndParseJSON(text);

        if (!Array.isArray(data)) {
            console.warn("[GeminiAI] Not an array, wrapping:", data);
            if (!data) return [];
            return [data];
        }
        return data;

    } catch (error) {
        console.error("Gemini API Error (Bank):", error);
        return [];
    }
};

exports.translateText = async (text, targetLang) => {
    return text + " (Translated)";
};

// Utilities
function cleanAndParseJSON(text) {
    try {
        // 1. Attempt strict clean
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Regex fallback: Find the first '[' and last ']' to ignore preamble
        const match = clean.match(/\[[\s\S]*\]/);
        if (match) {
            clean = match[0];
        }

        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Fail. Raw extract:", text.substring(0, 100));
        return null;
    }
}
