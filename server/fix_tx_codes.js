require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // The accountCode ObjectId 69accc7868bdad71f5c1d747 = 30100 (Share Capital)
    // But 30 transactions with this ObjectId have code string "10110" - WRONG
    // Fix: update code string to match what the ObjectId says
    
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const idToCode = {};
    accountCodes.forEach(ac => idToCode[ac._id.toString()] = ac.code);
    
    const transactions = await db.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    
    let fixed = 0;
    const ops = [];
    
    for (const t of transactions) {
        if (!t.accountCode) continue;
        const acId = t.accountCode.toString();
        const correctCode = idToCode[acId];
        if (correctCode && correctCode !== t.code) {
            console.log(`FIX: tx ${t._id} | date: ${new Date(t.date).toISOString().substring(0,10)} | code "${t.code}" → "${correctCode}" | in: $${t.moneyIn} | out: $${t.moneyOut}`);
            ops.push({
                updateOne: {
                    filter: { _id: t._id },
                    update: { $set: { code: correctCode } }
                }
            });
            fixed++;
        }
    }
    
    if (ops.length > 0) {
        await db.collection('transactions').bulkWrite(ops);
        console.log(`\n✅ Fixed ${fixed} transactions with wrong code strings`);
    } else {
        console.log('No code mismatches found - but both ObjectId pointers seem wrong.');
        console.log('The real issue: ObjectId 6970edb2 maps to 17270 (Office Equipment) but is used for ALL expenses');
    }
    
    // Now show the corrected totals
    const totals = await db.collection('transactions').aggregate([
        { $match: { companyCode: 'GK_SMART_AI' } },
        { $group: { _id: '$code', totalIn: { $sum: '$moneyIn' }, totalOut: { $sum: '$moneyOut' }, count: { $sum: 1 } }},
        { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n=== CORRECTED TRANSACTION TOTALS BY CODE ===');
    totals.forEach(t => {
        if (t.totalIn > 0 || t.totalOut > 0)
            console.log(`  ${t._id}: count=${t.count} | In=$${t.totalIn?.toFixed(2)} | Out=$${t.totalOut?.toFixed(2)}`);
    });
    
    mongoose.disconnect();
}).catch(e => console.error(e.message));
