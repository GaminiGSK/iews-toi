const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('../models/Transaction');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await Transaction.countDocuments({});
        console.log(`Total Transactions in DB: ${count}`);

        if (count > 0) {
            const sample = await Transaction.find({}).limit(5);
            console.log("Samples:");
            sample.forEach(t => console.log(`- ${t.date} | ${t.description} | ${t.amount} [Owner: ${t.user}]`));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
