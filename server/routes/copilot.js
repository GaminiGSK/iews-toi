const express = require('express');
const { CopilotRuntime, GoogleGenerativeAIAdapter } = require('@copilotkit/backend');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    try {
        console.log('[CopilotKit] Connection Initiated');
        const runtime = new CopilotRuntime();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const serviceAdapter = new GoogleGenerativeAIAdapter({ model });

        // Stream response back to client
        runtime.response(req, res, serviceAdapter);
    } catch (error) {
        console.error('[CopilotKit] Error:', error);
        res.status(500).json({ error: 'Copilot Connection Failed' });
    }
});

module.exports = router;
