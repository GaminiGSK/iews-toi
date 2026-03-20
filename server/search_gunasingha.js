const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txs = await db.collection('transactions').find({
        description: { $regex: 'GUNASINGHA', $options: 'i' }
    }).toArray();
    
    console.log('Found:', txs.length);
    if(txs.length > 0) {
        console.log(txs[0]);
    }

    process.exit(0);
});
