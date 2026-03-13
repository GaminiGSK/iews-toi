require('dotenv').config({path: '.env'});
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const T = require('./server/models/Transaction');
    const C = require('./server/models/AccountCode');
    
    console.log("Large 2025 Incomes:");
    const ghostIncome = await T.find({
        companyCode: 'GK_SMART_AI', 
        amount: { $gt: 0 },
        date: { $gte: new Date('2025-01-01') }
    }).sort({amount: -1}).limit(10);
    
    ghostIncome.forEach(t => console.log(t._id, t.date, t.amount, t.description.substring(0, 50)));

    console.log("\nEquity Txs in 30100:");
    const c30100 = await C.findOne({code: '30100', companyCode: 'GK_SMART_AI'});
    if(c30100) {
        const txs = await T.find({accountCode: c30100._id});
        txs.forEach(t => console.log(t._id, t.date, t.amount, t.description.substring(0, 50)));
    }
    process.exit(0);
}

run();
