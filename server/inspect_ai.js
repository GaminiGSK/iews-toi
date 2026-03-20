const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txai = await db.collection('transactions').find({
        tagSource: 'ai'
    }).toArray();
    
    console.log('Total AI TXs:', txai.length);
    txai.forEach(tx => console.log(tx.date?.toISOString()?.substring(0,10), tx.code, tx.amount, tx.description));
    process.exit(0);
});
