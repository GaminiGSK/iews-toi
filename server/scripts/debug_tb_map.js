const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const AccountCode = require('../models/AccountCode');
const Transaction = require('../models/Transaction');

async function testTB() {
    await mongoose.connect(process.env.MONGODB_URI);
    const codes = await AccountCode.find({ companyCode: 'GK_SMART_AI' }).lean();
    const transactions = await Transaction.find({ companyCode: 'GK_SMART_AI' }).populate('accountCode').lean();

    const reportMap = {};
    codes.forEach(c => {
        reportMap[c._id] = { id: c._id, code: c.code, targetCr: 0, targetDr: 0 };
    });

    let misses = 0;
    let untagged = 0;
    
    transactions.forEach(tx => {
        if (!tx.accountCode) {
            untagged++;
            return;
        }
        
        const codeId = tx.accountCode._id;
        
        if (!reportMap[codeId]) {
            misses++;
            console.error(`Miss: Object keys vs. populated ID: map keys=`, Object.keys(reportMap).slice(0, 3), ' | targetId=', codeId, ' | typeof=', typeof codeId);
            return;
        }

        const amtUSD = tx.amount;
        if (amtUSD > 0) reportMap[codeId].targetCr += amtUSD;
        else reportMap[codeId].targetDr += Math.abs(amtUSD);
    });

    console.log(`Total TX: ${transactions.length}`);
    console.log(`Untagged: ${untagged}`);
    console.log(`Misses: ${misses}`);
    console.log(`Sample valid code targets:`, Object.values(reportMap).filter(r => r.targetCr > 0 || r.targetDr > 0));
    process.exit(0);
}
testTB();
