const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const accountCodeObj = await db.collection('accountcodes').findOne({ code: '10110', companyCode: 'GK_SMART_AI' });
    console.log("Found 10110 Account Object _id:", accountCodeObj ? accountCodeObj._id : 'Missing');

    const txs = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', 
        code: '10110', 
    }).limit(10).toArray();
    
    txs.forEach(t => {
        console.log(`Amt: ${t.amount} | code: ${t.code} | accountCode: ${t.accountCode}`);
    });
    process.exit(0);
});
