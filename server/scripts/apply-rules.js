const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');

// Hardcoded for safety if .env fails, but usually better to rely on env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
}

const applyRules = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Fetch all Account Codes to map Code -> ID
        const codes = await AccountCode.find({});
        const codeMap = {}; // "10110" -> ObjectId
        codes.forEach(c => {
            codeMap[c.code] = c._id;
        });

        console.log(`ℹ️ Found ${codes.length} Account Codes`);

        // Verify required codes exist
        const requiredCodes = ["10110", "61070", "61100", "61220"];
        const missing = requiredCodes.filter(c => !codeMap[c]);
        if (missing.length > 0) {
            console.error(`❌ Missing required Account Codes in DB: ${missing.join(', ')}`);
            // We can proceed but some logic will fail
        }

        // 2. Fetch all Transactions
        const transactions = await Transaction.find({});
        console.log(`ℹ️ processing ${transactions.length} Transactions...`);

        let updatedCount = 0;

        for (const tx of transactions) {
            let targetCode = null;
            const amt = tx.amount;

            if (amt > 0) {
                // Rule 1: Income -> 10110
                targetCode = "10110";
            } else {
                // Expenses (Negative)
                // Logic:
                // < 10 (e.g. -5): 61220
                // < 100 (e.g. -50): 61100
                // >= 100 (e.g. -500): 61070

                // Note: Input is negative, e.g. -5.
                // Math.abs(-5) = 5.

                const absAmt = Math.abs(amt);

                if (absAmt < 10) {
                    targetCode = "61220"; // Bank Charges
                } else if (absAmt < 100) {
                    targetCode = "61100"; // Commission
                } else {
                    targetCode = "61070"; // Payroll
                }
            }

            if (targetCode && codeMap[targetCode]) {
                const newId = codeMap[targetCode];
                // Update if different
                if (!tx.accountCode || tx.accountCode.toString() !== newId.toString()) {
                    tx.accountCode = newId;
                    await tx.save();
                    updatedCount++;
                    process.stdout.write('.');
                }
            }
        }

        console.log(`\n✅ Successfully updated ${updatedCount} transactions.`);

    } catch (err) {
        console.error("❌ Script Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("👋 Disconnected");
    }
};

applyRules();
