const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// USER PROVIDED KEY
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCL3dNr_tpKtEHH5wJUzJHq4Ydx8w_xONE";

const genAI = new GoogleGenerativeAI(API_KEY);
// Upgrade to 2.0 Flash as 1.5 alias was missing for this key
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("[GeminiAI] Output Invalid/Empty. Raw:", text.substring(0, 100));
            // DEBUG FALLBACK: Return the raw text as a transaction so user can see it
            return [{
                date: "DEBUG_ERR",
                description: "AI Parse Failed. Raw Output: " + text.substring(0, 200).replace(/\n/g, ' '),
                moneyIn: 0,
                moneyOut: 0,
                balance: "0.00"
            }];
        }
        return data;

    } catch (error) {
        console.error("Gemini API Error (Bank):", error);
        return [{
            date: "FATAL_ERR",
            description: "API Failure: " + error.message,
            moneyIn: 0,
            moneyOut: 0,
            balance: "0.00"
        }];
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
