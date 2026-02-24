const mongoose = require('mongoose');
const TaxTemplate = require('../models/TaxTemplate');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const GENAI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Used for Vision 2.0 capabilities

const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iews_toi';
        await mongoose.connect(connStr);
        console.log(`MongoDB Connected: ${connStr.split('@')[1] || 'Local'} ...`); // Safe log
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

async function runIngestionAgent() {
    await connectDB();

    try {
        // 1. Fetch a target Template
        const template = await TaxTemplate.findOne().sort({ createdAt: -1 }); // Get latest
        if (!template) {
            console.log("No Tax Templates found to Analyze.");
            return;
        }

        console.log(`[Ingestion Agent] Waking up...`);
        console.log(`[Ingestion Agent] Analyzing Target: ${template.name}`);

        // Prepare Image
        // If template.path exists, use it. If "drive:", we might need to rely on base64 in .data
        let imagePart;
        if (template.data) {
            console.log(`[Ingestion Agent] Using stored Base64 data.`);
            imagePart = {
                inlineData: {
                    data: template.data,
                    mimeType: template.type || "image/png"
                }
            };
        } else if (fs.existsSync(template.path)) {
            console.log(`[Ingestion Agent] Reading local file: ${template.path}`);
            imagePart = fileToGenerativePart(template.path, template.type || "image/png");
        } else {
            console.error("[Ingestion Agent] Error: No file content available.");
            return;
        }

        // 2. The "Architect" Prompt
        const prompt = `
            You are the "Architect Agent". Your goal is to convert this static Tax Form image into a "Living Semantic Schema".
            
            Analyze the visual structure and text of provided form.
            identify every significant input field (text boxes, checkboxes, tables).
            
            For each field, do NOT just give coordinates. Give me:
            1. id: A unique programmatic key.
            2. label: The visible text label.
            3. type: 'text', 'number', 'date', 'checkbox'.
            4. intent: What is the PURPOSE of this field?
            5. logic: If applicable, is this a calculated field?
            6. visual_anchor: Describes where it is.
            7. bounding_box: { x: number, y: number, w: number, h: number } (Percentages 0-100).
            
            Return the output as a strictly valid JSON Object with a "schema" array.
            Exclude Markdown formatting. Just the JSON.
        `;

        console.log(`[Ingestion Agent] Sending to Logic Core (Gemini 1.5)...`);
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // 3. Process Result
        console.log(`[Ingestion Agent] Blueprint Received.`);

        let schemajson;
        try {
            // Clean markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            schemajson = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            return;
        }

        // 4. Save/Output
        const outputPath = path.join(__dirname, 'latest_schema.json');
        fs.writeFileSync(outputPath, JSON.stringify(schemajson, null, 2));

        console.log(`[Ingestion Agent] Mission Complete.`);
        console.log(`[Ingestion Agent] Dynamic Schema saved to: ${outputPath}`);
        console.log(`[Ingestion Agent] Preview of generated intelligence:`);
        console.log(JSON.stringify(schemajson.schema.slice(0, 3), null, 2)); // Show first 3 items

    } catch (err) {
        console.error("Agent Failure:", err);
    } finally {
        mongoose.disconnect();
    }
}

runIngestionAgent();
