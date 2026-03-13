require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const c = 'GK_SMART_AI';
    const cashCode = await AccountCode.findOne({code: '10110', companyCode: c});
    const txs = await Transaction.find({companyCode: c, accountCode: cashCode._id});
    
    console.log(`Cash Transactions (${txs.length}):`);
    let dr = 0; let cr = 0;
    txs.forEach(t => {
        if(t.amount > 0) cr += t.amount;
        else dr += Math.abs(t.amount);
    });
    console.log("Total mapped to Cash (as offset):", "Debit (from bank out):", dr, "Credit (from bank in):", cr);
    
    // show some
    txs.slice(0, 10).forEach(t => {
        console.log(t.date, t.amount, t.description);
    });

    process.exit(0);
});
