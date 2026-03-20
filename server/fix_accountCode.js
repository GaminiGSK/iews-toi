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
    let fixed = 0;

    for (const t of txs) {
        const expectedIdStr = codeToIdMap[t.code];
        const actualIdStr = t.accountCode ? t.accountCode.toString() : null;

        if (expectedIdStr && actualIdStr && expectedIdStr !== actualIdStr) {
            console.log(`Fixing TX ${t._id} | Code: ${t.code} | Tag: ${t.tagSource} | Old Ref: ${actualIdStr} (was ${idToCodeMap[actualIdStr]||'Unknown'}) -> New Ref: ${expectedIdStr}`);
            
            await db.collection('transactions').updateOne(
                { _id: t._id },
                { $set: { accountCode: new mongoose.Types.ObjectId(expectedIdStr) } }
            );
            fixed++;
        }
    }

    console.log(`Total fixed: ${fixed}`);
    process.exit(0);
});
