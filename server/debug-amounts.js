require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');
const JournalEntry = require('./models/JournalEntry');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const c = 'GK_SMART_AI';
    
    // Find biggest transactions
    const txs = await Transaction.find({companyCode: c}).sort({amount: -1}).limit(5).populate('accountCode');
    console.log("Biggest TXs:");
    txs.forEach(t => console.log(t._id, t.date, t.amount, t.description, t.accountCode ? t.accountCode.code : 'no-code'));
    
    const smallTxs = await Transaction.find({companyCode: c}).sort({amount: 1}).limit(5).populate('accountCode');
    console.log("\nSmallest TXs:");
    smallTxs.forEach(t => console.log(t._id, t.date, t.amount, t.description, t.accountCode ? t.accountCode.code : 'no-code'));
    
    // Check JEs
    const jes = await JournalEntry.find({companyCode: c, status: 'Posted'}).sort({'entries.debit': -1}).limit(2);
    console.log("\nBiggest JEs:");
    jes.forEach(je => console.log(je._id, je.description, je.entries));

    process.exit(0);
});
