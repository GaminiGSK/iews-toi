require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        const generateModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        console.log("Generate Content Models:");
        generateModels.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
