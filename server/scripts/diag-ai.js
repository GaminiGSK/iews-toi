const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkAI() {
    console.log("Checking GEMINI_API_KEY...");
    const key = process.env.GEMINI_API_KEY;
    console.log("Key starts with:", key ? key.substring(0, 5) + "..." : "MISSING");

    if (!key) return;

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say hello");
        console.log("AI Response:", result.response.text());
        console.log("AI CHECK SUCCESSFUL");
    } catch (err) {
        console.error("AI CHECK FAILED:", err);
    }
}

checkAI();
