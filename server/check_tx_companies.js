require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    const txs = await Transaction.aggregate([
        { $group: { _id: "$companyCode", count: { $sum: 1 } } }
    ]);
    console.log("Transactions by Company:");
    console.log(txs);
    process.exit(0);
});
