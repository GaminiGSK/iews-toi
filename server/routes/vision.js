const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Cloud Run / Local compatible uploads dir
const uploadsDir = (!fs.existsSync('/tmp')) ? path.join(__dirname, '../uploads') : '/tmp';

/**
 * DOCUMENT AI v3.0 (STARTER SKELETON)
 * ------------------------------------
 * This route is ready for Google Cloud Document AI integration.
 */

// POST /api/vision/extract
router.post('/extract', async (req, res) => {
    try {
        const { templateId } = req.body;
        console.log(`[Document AI v4.0] Initializing High-Fidelity Extraction for ID: ${templateId}`);

        const template = await TaxTemplate.findById(templateId);
        if (!template || !template.data) {
            return res.status(404).json({ error: "Template or image data missing." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Gemini API Key missing." });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            You are a professional Document AI agent specialized in Cambodian Tax Forms (TOI-01).
            EXTRACT EVERY SINGLE PIECE OF TEXT, CHECKBOX, AND INPUT FIELD from this document.
            Capture nearly 100 lines or more if present. Do not summarize.

            For each detected element, return:
            - khr: The Khmer text (if any).
            - eng: The English translation or English text.
            - x, y: Percentage coordinate (0-100) of top-left corner.
            - w, h: Percentage width and height (0-100).
            - type: "text", "check", or "input".

            Output ONLY a JSON object:
            {
               "ocr": [ { "id": 1, "khr": "...", "eng": "...", "x": 10.5, "y": 20.1, "w": 30, "h": 2, "type": "text" }, ... ],
               "kv": [ { "key": "...", "val": "...", "conf": 0.99 }, ... ],
               "tables": [ { "item": "...", "taxable": "...", "tax_due": "..." }, ... ]
            }

            Focus on capturing all small details, headers, and fields.
        `;

        const imagePart = {
            inlineData: {
                data: template.data,
                mimeType: "image/png" // Assuming PNG for templates
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const textResponse = response.text();

        let parsedData;
        try {
            parsedData = JSON.parse(textResponse);
        } catch (e) {
            console.error("JSON Parse Error in AI response:", textResponse);
            throw new Error("Invalid AI Response format.");
        }

        res.status(200).json(parsedData);
    } catch (err) {
        console.error("Document AI Critical Error:", err);
        res.status(500).json({
            error: "Neural Link Blocked: " + err.message,
            suggested_action: "Ensure your GEMINI_API_KEY is valid and not blocked."
        });
    }
});

module.exports = router;
