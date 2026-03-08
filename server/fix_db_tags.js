require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();

    const c61241 = accountCodes.find(c => c.code === '61241')._id;
    let c30100Id = new mongoose.Types.ObjectId();

    // Check if 30100 exists
    let drawingCode = await db.collection('accountcodes').findOne({ companyCode: 'GK_SMART_AI', code: '30100' });
    if (!drawingCode) {
        await db.collection('accountcodes').insertOne({ _id: c30100Id, code: '30100', description: 'Owner Drawings', companyCode: 'GK_SMART_AI' });
    } else {
        c30100Id = drawingCode._id;
    }

    const c61070 = accountCodes.find(c => c.code === '61070')._id;
    const c61220 = accountCodes.find(c => c.code === '61220')._id;

    const txs = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();

    for (let t of txs) {
        let changed = false;
        let desc = (t.description || '').toLowerCase();
        let currentCode = t.accountCode ? (accountCodes.find(c => c._id.toString() === t.accountCode.toString())?.code || t.code) : t.code;

        if (desc.includes('registration') && currentCode === '17250') {
            t.accountCode = c61241;
            t.code = '61241';
            changed = true;
        } else if (desc.includes('owner capital') && currentCode === '17250') {
            t.accountCode = c30100Id;
            t.code = '30100';
            changed = true;
        } else if (desc.includes('rent') && desc.includes('d414') && currentCode !== '61070') {
            t.accountCode = c61070;
            t.code = '61070';
            changed = true;
        } else if (desc.includes('ott charge') && currentCode === '61100') {
            t.accountCode = c61220;
            t.code = '61220';
            changed = true;
        }

        if (changed) {
            await db.collection('transactions').updateOne({ _id: t._id }, { $set: { accountCode: t.accountCode, code: t.code } });
            console.log('Fixed', t.code, t.description);
        }
    }

    console.log('Database fixes complete');
    process.exit(0);
});
