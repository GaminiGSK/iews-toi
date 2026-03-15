const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');
const CompanyProfile = require('./models/CompanyProfile');

async function applyBridgeInstructions() {
    await mongoose.connect(process.env.MONGODB_URI);
    const companyCode = 'GK_SMART_AI';
    
    console.log("Applying Bridge Instructions for:", companyCode);

    // 1. fill_toi_workspace updates
    const profileUpdate = {
        vatTin: 'K009-902103452',
        incorporationDate: '13/04/2021',
        director: 'Gunasingha KASSAPA GAMINI',
        companyType: 'Sole Proprietorship / Physical Person'
    };
    
    await CompanyProfile.updateOne({ companyCode }, { $set: profileUpdate });
    console.log("Updated CompanyProfile with TOI details:", profileUpdate);

    // 2. bulk_tag_ledger for GUNASINGHA KASSAPA GAMINI -> 30100
    const targetCodeObj = await AccountCode.findOne({ companyCode, code: '30100' });
    if (targetCodeObj) {
        const result = await Transaction.updateMany({
            companyCode,
            amount: { $gt: 0 },
            description: { $regex: /GUNASINGHA KASSAPA GAMINI/i }
        }, {
            $set: { accountCode: targetCodeObj._id, tagSource: 'ai_bridge' }
        });
        console.log(`Tagged ${result.modifiedCount} 'money_in' transactions matching 'GUNASINGHA KASSAPA GAMINI' to 30100.`);
    } else {
        console.log("Could not find AccountCode 30100");
    }

    // 3. auto_match_codes (Mock invocation or manual run)
    // To cleanly run auto-match, I'll instantiate AgentExecutor if needed, but the user's primary requests were the above two.
    // Let's just run the AI auto-match as well if we can
    const googleAI = require('./services/googleAI');
    const untagged = await Transaction.find({ companyCode, accountCode: { $exists: false } }).limit(50);
    const codes = await AccountCode.find({ companyCode }).lean();
    if (untagged.length > 0 && codes.length > 0) {
        console.log(`Auto-matching ${untagged.length} untagged transactions...`);
        try {
            const suggestions = await googleAI.suggestAccountingCodes(untagged, codes);
            let count = 0;
            for (const sugg of suggestions) {
                if (sugg.transactionId && sugg.accountCode) {
                    const ac = codes.find(c => c.code === sugg.accountCode);
                    if (ac) {
                        await Transaction.findByIdAndUpdate(sugg.transactionId, { accountCode: ac._id, tagSource: 'ai_bridge' });
                        count++;
                    }
                }
            }
            console.log(`Successfully auto-matched ${count} transactions.`);
        } catch (e) {
            console.log("Auto-match failed, possibly due to rate limits or API key:", e.message);
        }
    } else {
        console.log("No untagged transactions to auto-match.");
    }

    process.exit();
}

applyBridgeInstructions().catch(console.error);
