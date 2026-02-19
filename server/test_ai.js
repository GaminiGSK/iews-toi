const googleAI = require('./services/googleAI');
require('dotenv').config();

async function test() {
    try {
        console.log("Testing extractBankStatement with a dummy path...");
        // Since we don't have a real file, this might fail with FS error, 
        // but we want to know if the SYNTAX of the function is okay.
        // We'll mock fs.readFileSync in the test.
        const fs = require('fs');
        const oldRead = fs.readFileSync;
        fs.readFileSync = () => Buffer.from("dummy");

        // This will call Gemini, which might fail on the dummy data,
        // but it will prove the JS logic in googleAI.js is sound.
        const result = await googleAI.extractBankStatement("dummy.jpg");
        console.log("Result:", JSON.stringify(result));

        fs.readFileSync = oldRead;
    } catch (e) {
        console.error("Test Error:", e);
    }
    process.exit();
}

test();
