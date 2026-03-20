const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
    }).toArray();
    
    let fake = txs.filter(t => t.tagSource === 'bank_statement_restore');
    let real = txs.filter(t => t.tagSource === 'ai');
    
    console.log('--- FAKE DATA ---');
    fake.forEach(t => console.log(t.date?.toISOString().substring(0,10), `Code: ${t.code}`, `Amt: ${t.amount}`, t.description.substring(0,40)));

    console.log('\n--- REAL DATA ---');
    real.forEach(t => console.log(t.date?.toISOString().substring(0,10), `Code: ${t.code}`, `Amt: ${t.amount}`, t.description.substring(0,40)));

    process.exit(0);
});
