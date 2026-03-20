const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txai = await db.collection('transactions').find({
        tagSource: 'ai'
    }).sort({date: 1}).toArray();
    
    let out = 'Total AI TXs: ' + txai.length + '\n';
    txai.forEach(tx => out += `${tx.date?.toISOString()?.substring(0,10)} | ${tx.code} | ${tx.amount} | ${tx.description.substring(0, 30)}\n`);
    
    require('fs').writeFileSync('tmp_ai_tx.txt', out);
    process.exit(0);
});
