const express = require('express');
const router = express.Router();
const ExcelDocument = require('../models/ExcelDocument');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// GET all (Summary)
router.get('/', async (req, res) => {
    try {
        const docs = await ExcelDocument.find({}, 'name size uploadedAt headers').sort({ uploadedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET one (Full)
router.get('/:id', async (req, res) => {
    try {
        const doc = await ExcelDocument.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not Found' });
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (Upload)
router.post('/', async (req, res) => {
    try {
        const { name, size, headers, rows, merges, cellMappings, colWidths, rowHeights } = req.body;
        const newDoc = new ExcelDocument({ name, size, headers, rows, merges, cellMappings, colWidths, rowHeights });
        await newDoc.save();
        res.status(201).json(newDoc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Clean Endpoint
router.post('/ai-clean', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "No AI Key Configured" });
        const { rows } = req.body;
        // Analyze sample to avoid huge payload
        const sample = rows.slice(0, 20);
        // Create Gemini Model
        // Available: gemini-2.0-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Analyze this Excel data (first 20 rows) for a Tax Form.
        Identify structural issues.
        Return strictly valid JSON:
        {
            "delete_col_a": boolean, // True if Column A is just row numbers/indices
            "merge_suggestion": "description of suggestion",
            "confidence": number
        }
        Data: ${JSON.stringify(sample)}
        Response must be pure JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);

        res.json(analysis);
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: "AI Analysis Failed" });
    }
});

// PUT (Update Mappings)
router.put('/:id', async (req, res) => {
    try {
        const { cellMappings } = req.body;
        const doc = await ExcelDocument.findByIdAndUpdate(
            req.params.id,
            { $set: { cellMappings } },
            { new: true }
        );
        res.json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        await ExcelDocument.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
