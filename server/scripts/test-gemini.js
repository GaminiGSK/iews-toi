require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
console.log("Using Key ending in:", API_KEY.slice(-5));

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function test() {
    try {
        const result = await model.generateContent("Hello, are you working?");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Test Failed!");
        console.error("Status:", e.status);
        console.error("Message:", e.message);
        if (e.response) console.error("Details:", JSON.stringify(e.response, null, 2));
    }
}

test();
