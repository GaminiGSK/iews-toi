const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const ac = await db.collection('accountcodes').findOne({ code: '30100', companyCode: 'GK_SMART_AI' });
    
    // Find negative transactions tagged as 30100
    const txs = await db.collection('transactions').find({ 
        accountCode: ac._id, 
        amount: { $lt: 0 } 
    }).toArray();
    
    for (const t of txs) {
        console.log(`Untagging TX: amount=${t.amount}, desc=${t.description}`);
        await db.collection('transactions').updateOne(
            { _id: t._id },
            { $set: { accountCode: null, tagSource: 'system', code: null } }
        );
    }
    
    console.log(`Untagged ${txs.length} transactions incorrectly marked as 30100.`);
    process.exit(0);
});
