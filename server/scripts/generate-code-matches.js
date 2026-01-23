const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const AccountCode = require('../models/AccountCode');
const googleAI = require('../services/googleAI');

// Hardcoded for safety if .env fails
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
}

const generateRules = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const codes = await AccountCode.find({});
        console.log(`ℹ️ Found ${codes.length} Account Codes. Checking for missing match descriptions...`);

        let updatedCount = 0;

        for (const code of codes) {
            if (!code.matchDescription || code.matchDescription.length < 5) {
                console.log(`Generating rules for [${code.code}] ${code.description}...`);

                // Add a small delay to avoid rate limits if any
                await new Promise(r => setTimeout(r, 1000));

                const matchDesc = await googleAI.generateMatchDescription(code.code, code.description);
                if (matchDesc) {
                    code.matchDescription = matchDesc;
                    await code.save();
                    console.log(`   -> Saved: ${matchDesc.substring(0, 50)}...`);
                    updatedCount++;
                } else {
                    console.log("   -> Failed to generate.");
                }
            }
        }

        console.log(`\n✅ Successfully updated ${updatedCount} codes with AI Rules.`);

    } catch (err) {
        console.error("❌ Script Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected");
    }
};

generateRules();
