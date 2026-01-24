require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const checkTx = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find first 5 transactions
        const txs = await Transaction.find().limit(5);
        console.log('Sample Transactions:', JSON.stringify(txs, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkTx();
