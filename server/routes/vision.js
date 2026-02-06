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

// POST /api/vision/extract - [PLACEHOLDER]
router.post('/extract', async (req, res) => {
    try {
        const { filename } = req.body;
        console.log(`[Document AI v3.0] Initializing fresh scan for: ${filename}`);

        // TODO: Implement Google Cloud Document AI Client
        // 1. Authenticate with Service Account
        // 2. Load Processors
        // 3. Send Document for Intelligent Extraction

        res.status(200).json({
            message: "Document AI v3.0 initialized. Awaiting API integration.",
            ocr_raw: [],
            reasoned_layout: []
        });
    } catch (err) {
        console.error("Document AI Error:", err);
        res.status(500).json({ error: "System starting from scratch. API not linked yet." });
    }
});

module.exports = router;
