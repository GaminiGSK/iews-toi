const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    // Load all account codes into a map
    const codeDocs = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToIdMap = {};
    const idToCodeMap = {};
    codeDocs.forEach(c => {
        codeToIdMap[c.code] = c._id.toString();
        idToCodeMap[c._id.toString()] = c.code;
    });

    // Check all transactions
    const txs = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let mismatched = 0;
    let missingId = 0;

    txs.forEach(t => {
        const expectedId = codeToIdMap[t.code];
        const actualId = t.accountCode ? t.accountCode.toString() : null;

        if (expectedId && actualId && expectedId !== actualId) {
            mismatched++;
            // Uncomment to see details
            // console.log(`Mismatch | TX Code: ${t.code} | Expected ID: ${expectedId} | Actual ID: ${actualId} (Code: ${idToCodeMap[actualId] || 'Unknown'})`);
        } else if (!actualId && expectedId) {
            missingId++;
        }
    });

    console.log(`Total TXs: ${txs.length}`);
    console.log(`Mismatched accountCode refs: ${mismatched}`);
    console.log(`Missing accountCode refs: ${missingId}`);

    process.exit(0);
});
