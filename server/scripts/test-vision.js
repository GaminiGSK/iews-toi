const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// User's Key
const API_KEY = "AIzaSyCL3dNr_tpKtEHH5wJUzJHq4Ydx8w_xONE";
const genAI = new GoogleGenerativeAI(API_KEY);

const IMAGE_PATH = path.join(__dirname, '../test-image.jpg');

// Models to test for Vision capability
const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest"
];

async function testModel(modelName) {
    try {
        console.log(`\n--- Testing ${modelName} ---`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const imagePart = {
            inlineData: {
                data: fs.readFileSync(IMAGE_PATH).toString("base64"),
                mimeType: "image/jpeg"
            },
        };

        const result = await model.generateContent([
            "Describe this image details generally.",
            imagePart
        ]);
        const response = await result.response;
        console.log(`✅ SUCCESS: ${modelName} responded!`);
        console.log(`Output Snippet: ${response.text().substring(0, 100)}...`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${modelName}`);
        console.log(`Error: ${error.message} (Code: ${error.status || 'N/A'})`);
        if (error.response) console.log(JSON.stringify(error.response, null, 2));
        return false;
    }
}

async function runTests() {
    console.log("Starting Vision Capability Scan...");
    if (!fs.existsSync(IMAGE_PATH)) {
        console.error("Test image not found at:", IMAGE_PATH);
        return;
    }

    for (const m of modelsToTest) {
        const success = await testModel(m);
        if (success) {
            console.log(`\n🎉 WE HAVE A WINNER: ${m}`);
            console.log("We can use this model for the Vision Approach!");
            break; // Stop after finding the first working vision model
        }
    }
}

runTests();
