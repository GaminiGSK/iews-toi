require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const googleAI = require('../services/googleAI');

async function diagnosticStep1() {
    console.log("DIAGNOSTIC 1: Verifying Vision Logs and Text Harvest...");

    // Use one of the uploaded jpg files
    const testFile = 'e:/Antigravity/TOI/server/uploads/1768370659877-456513668.jpg';

    try {
        const result = await googleAI.analyzeTaxForm(testFile);
        console.log("--- HARVESTED TEXT (Summary) ---");
        console.log(result.rawText || "EMPTY - Image might be blurry or unreadable.");
        console.log("---------------------------------");
        console.log(`Fields Found: ${result.mappings.length}`);

        if (result.mappings.length === 0 && result.rawText) {
            console.log("STATUS: AI can see text but cannot define coordinate boxes. Prompt tuning required.");
        } else if (!result.rawText) {
            console.log("STATUS: AI is blind to this image. Check resolution/quality.");
        } else {
            console.log("STATUS: Success.");
        }
    } catch (e) {
        console.error("DIAGNOSTIC 1 FAILED:", e);
    }
}

diagnosticStep1();
