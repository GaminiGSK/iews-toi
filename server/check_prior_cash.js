const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;

    const txsBefore2024 = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        code: '10110',
        date: { $lt: new Date('2024-01-01') } 
    }).toArray();
    console.log('Txs before 2024:', txsBefore2024.length);
    
    let sum10110Before2024 = 0;
    txsBefore2024.forEach(t => sum10110Before2024 += (t.moneyIn||0) - (t.moneyOut||0));
    console.log('Net change before 2024:', sum10110Before2024);

    const acc = await db.collection('accountcodes').findOne({ code: '10110', companyCode: 'GK_SMART_AI' });
    console.log('Account 10110 priorYearDr:', acc.priorYearDr, 'priorYearCr:', acc.priorYearCr);

    process.exit(0);
});
