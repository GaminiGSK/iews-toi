const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Transaction = require('../models/Transaction');
const BankFile = require('../models/BankFile');
const User = require('../models/User');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log(`Users: ${users.length}`);

        for (const u of users) {
            console.log(`\n--- Company: ${u.companyCode} ---`);
            const files = await BankFile.find({ companyCode: u.companyCode });
            console.log(`Bank Files Found: ${files.length}`);
            files.forEach(f => {
                console.log(`  File: ${f.originalName} | Range: ${f.dateRange} | Status: ${f.status}`);
            });

            const txs = await Transaction.find({ companyCode: u.companyCode }).sort({ date: -1 }).limit(10);
            console.log(`Recent Transactions (${txs.length}):`);
            txs.forEach(t => {
                console.log(`  Date: ${t.date} | Desc: ${t.description.substring(0, 30)} | ID: ${t._id}`);
            });
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
debug();
