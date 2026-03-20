const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        code: '10110', 
        date: { $gte: new Date('2024-01-01'), $lt: new Date('2026-01-01') } 
    }).sort({date:1}).toArray();
    
    // Group by Year and Month
    const monthlyNet = {
        '2024': Array(12).fill(0),
        '2025': Array(12).fill(0)
    };

    txs.forEach(t => {
        const year = t.date.getFullYear().toString();
        const month = t.date.getMonth();
        const net = (t.moneyIn || 0) - (t.moneyOut || 0);
        if (monthlyNet[year]) {
            monthlyNet[year][month] += net;
        }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    console.log("=== 2024 Cash on Hand (10110) ===");
    monthlyNet['2024'].forEach((val, i) => {
        console.log(`${monthNames[i]} 2024: $${val.toFixed(2)}`);
    });

    console.log("\n=== 2025 Cash on Hand (10110) ===");
    monthlyNet['2025'].forEach((val, i) => {
        console.log(`${monthNames[i]} 2025: $${val.toFixed(2)}`);
    });

    process.exit(0);
});
