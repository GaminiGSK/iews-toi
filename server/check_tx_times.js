const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({
        date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') }
    }).toArray();
    
    // Sort by _id to see insertion order, because ObjectId contains timestamp
    txs.sort((a,b) => a._id.getTimestamp() - b._id.getTimestamp());
    
    console.log("Oldest 5 TX timestamps:");
    txs.slice(0, 5).forEach(t => console.log(t._id.getTimestamp(), t.tagSource));

    console.log("Newest 5 TX timestamps:");
    txs.slice(-5).forEach(t => console.log(t._id.getTimestamp(), t.tagSource));

    process.exit(0);
});
