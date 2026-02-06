const { GoogleGenerativeAI } = require('@google/generative-ai');

const key = "AIzaSyChPOMe6tCoxVOwgxwszhRaWr4Vsbw3iB0";
const genAI = new GoogleGenerativeAI(key);

async function run() {
    console.log("Testing Key:", key.substring(0, 5) + "...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        console.log("Success");
    } catch (e) {
        console.error("FULL ERROR:", e);
    }
}
run();
