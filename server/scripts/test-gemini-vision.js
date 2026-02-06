const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../.env' });

async function testVision() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // We don't have an image path ready here, but we can verify the API key by listing models or similar
    console.log("Gemini API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    try {
        const result = await model.generateContent("Hello, verify system.");
        console.log("Verification Response:", result.response.text());
        console.log("SUCCESS: Gemini API is active.");
    } catch (e) {
        console.error("Gemini API Error:", e);
    }
}

testVision();
