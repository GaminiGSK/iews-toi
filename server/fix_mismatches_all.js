const mongoose = require('mongoose');
require('dotenv').config();

const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const codes = await AccountCode.find({ companyCode: 'GK_SMART_AI' }).lean();
    const codeMap = {};
    const idMap = {};
    codes.forEach(c => {
        codeMap[c.code] = c._id.toString();
        idMap[c._id.toString()] = c.code;
    });

    const txs = await Transaction.find({ companyCode: 'GK_SMART_AI' }).lean();
    let fixed = 0;

    for (const t of txs) {
        if (!t.accountCode) continue; // Skip unassigned
        
        const actualCodeObjIdStr = t.accountCode.toString();
        const expectedCodeStr = t.code; // What AI tagged it as
        
        // Let's force accountCode to point to whatever t.code is!
        const expectedObjIdStr = codeMap[expectedCodeStr];
        
        if (expectedObjIdStr && actualCodeObjIdStr !== expectedObjIdStr) {
            console.log(`Fixing TX ${t._id} | Text code: ${expectedCodeStr} | Current DB link: ${idMap[actualCodeObjIdStr]} -> Fix to: ${expectedCodeStr}`);
            await Transaction.updateOne({ _id: t._id }, { $set: { accountCode: new mongoose.Types.ObjectId(expectedObjIdStr) } });
            fixed++;
        }
    }

    console.log(`Total fixed: ${fixed}`);
    process.exit(0);
});
