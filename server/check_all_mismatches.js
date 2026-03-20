const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const codeDocs = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToObj = {};
    const idToCode = {};
    codeDocs.forEach(c => {
        codeToObj[c.code] = c;
        idToCode[c._id.toString()] = c;
    });

    const txs = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    
    let mismatched = 0;

    txs.forEach(t => {
        const expectedCodeStr = t.code;
        const actualCodeObj = t.accountCode ? idToCode[t.accountCode.toString()] : null;
        const actualCodeStr = actualCodeObj ? actualCodeObj.code : null;

        if (expectedCodeStr && actualCodeStr && expectedCodeStr !== actualCodeStr) {
            console.log(`Mismatch: TX _id: ${t._id} | amount: ${t.amount} | t.code: '${expectedCodeStr}' | t.accountCode -> '${actualCodeStr}' | description: ${t.description.substring(0, 30)}`);
            mismatched++;
        }
    });

    console.log(`Total Mismatched: ${mismatched}`);
    process.exit(0);
});
