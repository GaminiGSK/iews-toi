require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');

async function fixBalances() {
    await mongoose.connect(process.env.MONGODB_URI);
    const c = 'GK_SMART_AI';
    
    const codes = await AccountCode.find({ companyCode: c });
    const codeMap = {};
    codes.forEach(cc => codeMap[cc.code] = cc);

    const txs = await Transaction.find({ companyCode: c }).populate('accountCode');
    
    // 1. Find 30100 transactions to see what's in there
    const eqCode = codeMap['30100'];
    const eqTxs = await Transaction.find({ companyCode: c, accountCode: eqCode._id });
    console.log("30100 Equity Txs:");
    eqTxs.forEach(t => console.log(`  ${t.date.toISOString().split('T')[0]} | ${t.amount} | ${t.description.substring(0, 50)}...`));

    // 2. Look for the double-counted ~49k income. Let's list big revenue (4xxxx) txs
    const revCodes = codes.filter(c => c.code.startsWith('4')).map(c => c._id);
    const revTxs = await Transaction.find({ companyCode: c, accountCode: { $in: revCodes } }).sort({amount: 1});
    console.log("\nRevenue Txs:");
    revTxs.forEach(t => console.log(`  ${t.date.toISOString().split('T')[0]} | Code: ${t.accountCode} | ${t.amount} | ${t.description.substring(0, 50)}...`));

    // 3. Find the $18k Auto payment
    const autoCode = codeMap['17290']; // Cost of Automobile
    const autoTxs = await Transaction.find({ companyCode: c, accountCode: autoCode._id });
    console.log("\n17290 Auto Txs:");
    autoTxs.forEach(t => console.log(`  ${t.date.toISOString().split('T')[0]} | Code: ${t.accountCode} | ${t.amount} | ${t.description.substring(0, 50)}...`));

    const expCodes = codes.filter(c => c.code.startsWith('6')).map(c => c._id);
    const bigExpTxs = await Transaction.find({ companyCode: c, accountCode: { $in: expCodes }, amount: { $lte: -10000 } });
    console.log("\nBig Exp Txs (looking for $18k loss):");
    bigExpTxs.forEach(t => console.log(`  ${t.date.toISOString().split('T')[0]} | Code: ${t.accountCode} | ${t.amount} | ${t.description.substring(0, 50)}...`));

    process.exit(0);
}

fixBalances().catch(console.error);
