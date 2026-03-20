const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        code: '10110', 
    }).limit(5).sort({ date: 1 }).toArray();

    txs.forEach(t => {
        console.log(`[${t.date.toISOString().split('T')[0]}] Money In: ${t.moneyIn} | Money Out: ${t.moneyOut} | Amount Field: ${t.amount}`);
    });
    process.exit(0);
});
