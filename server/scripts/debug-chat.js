require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are an expert Financial AI Agent."
});

async function testChat() {
    const context = {
        companyName: "Test Co",
        codes: [{ code: "10110", description: "Cash" }],
        recentTransactions: [],
        summary: { balance: "100.00", income: "200.00", expense: "100.00" },
        monthlyStats: [],
        ui: { route: "Dashboard" }
    };
    const message = "tell me about Resident tax payer";

    const { companyName, codes, recentTransactions, summary, monthlyStats, ui } = context;

    const prompt = `
        You are an expert Financial Assistant for the company "${companyName}".
        ...
        User Query: "${message}"
        Answer:
    `;

    try {
        console.log("Sending prompt...");
        const result = await model.generateContent([prompt]);
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("FAILED!");
        console.error("Status:", e.status);
        console.error("Message:", e.message);
        if (e.response) {
            try {
                const resp = await e.response.text();
                console.error("Body:", resp);
            } catch (err) { }
        }
    }
}

testChat();
