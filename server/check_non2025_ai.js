const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txai = await db.collection('transactions').find({
        tagSource: 'ai'
    }).toArray();
    
    console.log('Total AI TXs in DB:', txai.length);
    const non2025 = txai.filter(t => t.date?.getFullYear() !== 2025);
    console.log('AI TXs NOT in 2025:', non2025.length);
    if(non2025.length > 0) {
        non2025.forEach(tx => console.log(tx.date, tx.amount, tx.description.substring(0,30)));
    }
    process.exit(0);
});
