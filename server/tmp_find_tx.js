const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const txs = await Transaction.find({ 
        companyCode: 'GK_SMART_AI', 
        amount: { $gt: 0 }, 
        description: { $regex: /GUNASINGHA KASSAPA GAMINI/i } 
    }).populate('accountCode');
    console.log(`Found ${txs.length} incoming transactions from GUNASINGHA KASSAPA GAMINI`);
    if(txs.length > 0) {
        console.log("Sample:", txs[0].amount, txs[0].description, txs[0].accountCode ? txs[0].accountCode.code : 'no-code');
    }
    process.exit();
});
