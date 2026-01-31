require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function test() {
    try {
        const result = await model.generateContent("Hello, who are you? Tell me about Cambodian tax resident.");
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("Test Failed!");
        console.error("Status:", e.status);
        console.error("Message:", e.message);
        if (e.response) {
            const respText = await e.response.text();
            console.error("Response Body:", respText);
        }
    }
}

test();
