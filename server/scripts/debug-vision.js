require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testAnalysis(imagePath) {
    console.log(`Testing Gemini 2.0 Flash Vision for: ${imagePath}`);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
        List EVERY interactive input box, square for TIN/Numbers, or checkbox on this document.
        For each field, return a JSON object with:
        - label: Short English name (e.g., "TIN", "Name of Enterprise", "Address").
        - x, y: Percentage (0-100) coordinates of top-left.
        - w, h: Percentage (0-100) width and height.
        - type: "text" or "checkbox".

        Return a JSON object with:
        - "fields": array of field objects.
        - "rawText": A string containing all harvested text from the document (summary).
    `;

    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: "image/png"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        console.log("--- RAW AI OUTPUT ---");
        console.log(text);
        console.log("--- END RAW AI OUTPUT ---");
    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
}

testAnalysis('C:/Users/Gamini/.gemini/antigravity/brain/29ac5434-7ea9-4311-9d63-9413fe932f59/uploaded_media_1769727051957.png');
