require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testAnalysis(imagePath) {
    console.log("Testing Gemini 2.0 Vision for Layout Analysis...");
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
        List EVERY rectangular input field or checkbox on this document.
        Return as a JSON object with a 'fields' key containing an array of:
        { "name": "label", "x": 0-100, "y": 0-100, "w": 0-100, "h": 0-100, "type": "text|checkbox" }
    `;

    const fileBuffer = fs.readFileSync(imagePath);
    const imagePart = {
        inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType: "image/jpeg"
        }
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        console.log("--- RAW AI OUTPUT ---");
        console.log(text);
        console.log("--- END RAW AI OUTPUT ---");

        const data = JSON.parse(text);
        console.log("Parsed Fields Count:", (data.fields || data.mappings || data || []).length);
    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
}

// Check if any template file exists in server/uploads or /tmp
const testDir = './server/uploads';
if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir);
    if (files.length > 0) {
        testAnalysis(path.join(testDir, files[0]));
    } else {
        console.log("No files in uploads folder to test.");
    }
} else {
    console.log("Uploads folder does not exist.");
}
