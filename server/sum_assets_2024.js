const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        date: { $gte: new Date('2024-01-01'), $lt: new Date('2025-01-01') } 
    }).toArray();
    
    const tByAcc = {};
    const moByAcc = {};
    txs.forEach(t => { 
        if (!t.code) return;
        if(!tByAcc[t.code]) tByAcc[t.code] = 0; 
        tByAcc[t.code] += (t.moneyIn || 0) - (t.moneyOut || 0);

        if(!moByAcc[t.code]) moByAcc[t.code] = Array(12).fill(0);
        const m = t.date.getMonth();
        moByAcc[t.code][m] += (t.moneyIn || 0) - (t.moneyOut || 0);
    }); 
    
    // Log balances for '10' codes
    Object.keys(tByAcc).forEach(k => {
        if (k.startsWith('10')) {
            console.log(`Code: ${k} | Net 2024: ${tByAcc[k]}`);
            console.log(`Monthly: ${moByAcc[k].map(v => v.toFixed(2)).join(', ')}`);
        }
    });

    process.exit(0);
});
