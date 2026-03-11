require('dotenv').config();
const mongoose = require('mongoose');

async function runOverride() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Transaction = require('./models/Transaction');
    const AccountCode = require('./models/AccountCode');
    const companyCode = 'GK_SMART_AI';
    
    console.log("Starting Master Audit Override...");

    // 1. Equity Re-Classification
    const sourceCode = "30100";
    const targetCode = "61000";
    const codeRefSource = await AccountCode.findOne({ code: sourceCode, companyCode });
    const codeRefTarget = await AccountCode.findOne({ code: targetCode, companyCode });
    
    if (codeRefSource && codeRefTarget) {
        const misclassTxs = await Transaction.find({
            accountCode: codeRefSource._id,
            companyCode,
            $or: [
                { description: { $regex: /OUTWARD CHECK|CEYLEK|Check/i } },
                { amount: { $lt: 0 } },
                { amount: 1510 },
                { amount: 5300 },
                { amount: 1490.16 }
            ]
        });

        console.log(`Found ${misclassTxs.length} misclassified Equity transactions.`);
        for (let tx of misclassTxs) {
            tx.accountCode = codeRefTarget._id;
            tx.tagSource = 'rule';
            await tx.save();
            console.log(`Moved: ${tx.amount} to 61000`);
        }
    }

    // 2. Clear unverified 2024 rollovers
    const JournalEntry = require('./models/JournalEntry');
    const deletedJE = await JournalEntry.deleteMany({ companyCode, date: { $gte: new Date('2025-01-01') }, status: 'Posted', description: { $regex: /opening|closing|anchor/i } });
    console.log(`Anchor Enforced. Purged ${deletedJE.deletedCount} unverified manual rollovers.`);

    // 3. Enforce KHR Lock
    const CompanyProfile = require('./models/CompanyProfile');
    await CompanyProfile.findOneAndUpdate(
        { companyCode }, 
        { $set: { "settings.khr_lock": true } }, 
        { upsert: true }
    );
    console.log("TOI Currency Logic locked to KHR.");

    console.log("Sync complete.");
    process.exit(0);
}

runOverride().catch(console.error);
