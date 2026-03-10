const mongoose = require('mongoose');
require('dotenv').config();

async function testLedger() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const Transaction = require('./models/Transaction');
    const AccountCode = require('./models/AccountCode');
    const User = require('./models/User');

    const txs = await Transaction.find().lean();
    console.log(`Transactions: ${txs.length}`);
    
    // Check for null or strange descriptions, amounts, etc.
    let nullDescs = 0;
    let strangeAmounts = 0;
    let nanAmounts = 0;

    for (const t of txs) {
        if (t.description === null || t.description === undefined) nullDescs++;
        if (typeof t.amount === 'string') strangeAmounts++;
        if (isNaN(Number(t.amount))) nanAmounts++;
    }

    console.log(`Null descriptions: ${nullDescs}`);
    console.log(`String amounts: ${strangeAmounts}`);
    console.log(`NaN amounts: ${nanAmounts}`);

    const codes = await AccountCode.find({ companyCode: "GKSMART" }).lean();
    console.log(`Codes: ${codes.length}`);

    let nullCodeDescs = 0;
    for (const c of codes) {
        if (c.description === null || c.description === undefined) nullCodeDescs++;
    }
    console.log(`Null code descriptions: ${nullCodeDescs}`);

    if (txs.length > 0) {
        console.log("\nSome sample data:", JSON.stringify(txs.slice(0, 2), null, 2));
    }

    process.exit();
}

testLedger();
