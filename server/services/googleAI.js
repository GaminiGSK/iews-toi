const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

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
        const imagePart = fileToGenerativePart(filePath, "image/jpeg"); // Assuming JPEG/PNG, typical for uploads

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
        // High-Precision Prompt for Financial Data
        const prompt = `
            Analyze this Bank Statement image.
            Extract all transaction rows into a JSON Array.
            Each object must have:
            - "date": Format like "Feb 10, 2025"
            - "description": The full transaction details/remark.
            - "moneyIn": The credit amount (numeric, no commas, 0 if empty/dash).
            - "moneyOut": The debit amount (numeric, no commas, 0 if empty/dash).
            - "balance": The running balance (string, keep commas).

            Return ONLY the JSON Array. No markdown formatting.
        `;

        // Determine mime type roughly (or just default/try)
        // For robustness, could check extension, but standard uploads are images/pdf
        const isPdf = filePath.toLowerCase().endsWith('.pdf');
        const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';

        const filePart = fileToGenerativePart(filePath, mimeType);

        const result = await model.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        console.log("[GeminiAI] Raw Output Length:", text.length);
        const data = cleanAndParseJSON(text);

        if (!Array.isArray(data)) {
            console.warn("[GeminiAI] Output was not an array, wrapping.");
            return data ? [data] : [];
        }
        return data;

    } catch (error) {
        console.error("Gemini API Error (Bank):", error);
        // Fallback to empty to prevent crash, let UI show error
        return [];
    }
};

exports.translateText = async (text, targetLang) => {
    // Simple translation pass-through
    // In real app, could also use Gemini for this!
    return text + " (Translated)";
};

// Utilities
function cleanAndParseJSON(text) {
    try {
        // Remove markdown code blocks if present ```json ... ```
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Fail:", text.substring(0, 100));
        return null;
    }
}

// Retaining legacy mock functions for safety if needed, but not exporting them
const legacyMock = {}; 
