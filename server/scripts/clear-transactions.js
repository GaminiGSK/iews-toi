const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

console.log('Connecting to:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        console.log('Deleting all transactions...');
        const result = await Transaction.deleteMany({});
        console.log(`Deleted ${result.deletedCount} transactions.`);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
