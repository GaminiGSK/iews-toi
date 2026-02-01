const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const googleAI = require('../services/googleAI');

async function testChat() {
    console.log("Testing Chat Service Flow...");
    console.log("Node Env Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

    try {
        const context = {
            companyName: "Test Corp",
            codes: [],
            summary: { balance: "100.00", income: "100.00", expense: "0.00" },
            monthlyStats: {},
            ui: { route: "/test" }
        };

        const response = await googleAI.chatWithFinancialAgent("Hello, this is a test.", context);
        console.log("---------------------------------------------------");
        console.log("Response:", response);
        console.log("---------------------------------------------------");

        if (response.includes("API key not valid")) {
            console.error("FAIL: Service returned API Key Error");
            process.exit(1);
        } else {
            console.log("SUCCESS: Service execution complete.");
            process.exit(0);
        }

    } catch (error) {
        console.error("CRITICAL TEST FAILURE:", error);
        process.exit(1);
    }
}

testChat();
