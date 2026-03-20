const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI'
    }).toArray();
    
    let sumIn = 0;
    let sumOut = 0;
    
    txs.forEach(t => {
        const amt = parseFloat(t.amount || 0);
        if (amt === -1000 || amt === -600 || amt === -400 || amt === -540 || amt === 1000 || amt === 600 || amt === 400 || amt === 540) {
            console.log(`Date: ${t.date.toISOString().split('T')[0]} | Amt: ${amt} | code: ${t.code} | Tag: ${t.tagSource} | Ref: ${t.accountCode}`);
        }
    });

    // Check specific totals based on accountCode
    const code30100 = await db.collection('accountcodes').findOne({ code: '30100', companyCode: 'GK_SMART_AI' });
    const code17270 = await db.collection('accountcodes').findOne({ code: '17270', companyCode: 'GK_SMART_AI' });
    
    const txs30100 = await db.collection('transactions').find({ accountCode: code30100._id }).toArray();
    let sIn3 = 0, sOut3 = 0;
    txs30100.forEach(t => {
        const amt = parseFloat(t.amount || 0);
        if (amt > 0) sIn3 += amt; else sOut3 += Math.abs(amt);
    });
    
    const txs17270 = await db.collection('transactions').find({ accountCode: code17270._id }).toArray();
    let sIn1 = 0, sOut1 = 0;
    txs17270.forEach(t => {
        const amt = parseFloat(t.amount || 0);
        if (amt > 0) sIn1 += amt; else sOut1 += Math.abs(amt);
    });

    console.log(`\nGL 30100: Total In = ${sIn3}, Total Out = ${sOut3}, Count = ${txs30100.length}`);
    console.log(`GL 17270: Total In = ${sIn1}, Total Out = ${sOut1}, Count = ${txs17270.length}`);

    process.exit(0);
});
