const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
    }).sort({date: 1}).toArray();
    
    let fake = txs.filter(t => t.tagSource === 'bank_statement_restore');
    let real = txs.filter(t => t.tagSource === 'ai');
    
    let out = '--- FAKE DATA ---\n';
    fake.forEach(t => out += `${t.date?.toISOString().substring(0,10)} | Code: ${t.code} | Amt: ${t.amount} | ${t.description.substring(0,40)}\n`);

    out += '\n--- REAL DATA (AI EXTRACTED) ---\n';
    real.forEach(t => out += `${t.date?.toISOString().substring(0,10)} | Code: ${t.code} | Amt: ${t.amount} | ${t.description.substring(0,40)}\n`);

    fs.writeFileSync('compare_out_utf8.txt', out, 'utf8');
    process.exit(0);
});
