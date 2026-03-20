const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const tx2025 = await db.collection('transactions').find({
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
    }).toArray();
    
    const countByTag = {};
    tx2025.forEach(tx => {
        const tag = tx.tagSource || 'NONE';
        countByTag[tag] = (countByTag[tag] || 0) + 1;
    });

    console.log('2025 TXs by tag:', countByTag);
    process.exit(0);
});
