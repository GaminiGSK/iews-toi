require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const TEST_KEY = "AIzaSyCL3dNr_tpKtEHH5wJUzJHq4Ydx8w_xONE";
const genAI = new GoogleGenerativeAI(TEST_KEY);

async function testKey() {
    console.log("Testing Key: " + TEST_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello?");
        const response = await result.response;
        console.log("Success! Response: " + response.text());
    } catch (e) {
        console.error("FAILED with this key:", e.message);
    }
}

testKey();
