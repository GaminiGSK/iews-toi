const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        code: '10110', 
        date: { $gte: new Date('2024-01-01'), $lt: new Date('2025-01-01') } 
    }).sort({date:1}).toArray();
    
    txs.forEach(t => console.log(t.date?.toISOString().substring(0,10), `Amt: ${t.amount}`, `Tag: ${t.tagSource}`, t.description));
    process.exit(0);
});
