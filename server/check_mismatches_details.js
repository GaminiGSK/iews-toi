const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const codeDocs = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToIdMap = {};
    const idToCodeMap = {};
    codeDocs.forEach(c => {
        codeToIdMap[c.code] = c._id.toString();
        idToCodeMap[c._id.toString()] = c.code;
    });

    const txs = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    txs.forEach(t => {
        const expectedId = codeToIdMap[t.code];
        const actualId = t.accountCode ? t.accountCode.toString() : null;

        if (expectedId && actualId && expectedId !== actualId) {
            console.log(`TX Code: ${t.code} | Tag: ${t.tagSource} | Expected ID: ${expectedId} | Actual ID: ${actualId} (Points to: ${idToCodeMap[actualId] || 'Unknown'})`);
        }
    });

    process.exit(0);
});
