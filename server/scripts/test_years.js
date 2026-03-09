const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const Transaction = require('../models/Transaction');
const JournalEntry = require('../models/JournalEntry');
const AccountCode = require('../models/AccountCode');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected");

    // We don't know the exact companyCode, but we can look for any transaction
    const tx = await Transaction.find().limit(5);
    console.log("Transactions:", tx.map(t => ({ date: t.date, amt: t.amount, companyCode: t.companyCode })));

    const je = await JournalEntry.find().limit(5);
    console.log("Journal Entries:", je.map(t => ({ date: t.date, companyCode: t.companyCode })));

    // Check account codes for prior year data
    const codes = await AccountCode.find().limit(5);
    console.log("Codes:", codes.map(c => ({ code: c.code, priorDr: c.priorYearDr, priorCr: c.priorYearCr })));

    process.exit(0);
}
test();
