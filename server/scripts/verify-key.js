require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

console.log("Checking GEMINI_API_KEY...");

if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from .env");
    process.exit(1);
}

// Don't print the full key, just the start/end to verify it's not empty text
console.log(`✅ Key found: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`);

async function testKey() {
    console.log("Testing API connectivity...");
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello, are you online?");
        const response = await result.response;
        console.log("✅ Success! AI Responded:", response.text());
        console.log("\nIf you see this message, the key in .env is VALID.");
        console.log("👉 ACTION REQUIRED: Please RESTART your running server to pick up the changes.");
    } catch (e) {
        console.error("❌ API Test Failed:", e.message);
        console.error("Reason:", JSON.stringify(e, null, 2));
    }
}

testKey();
