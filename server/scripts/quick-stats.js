const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Transaction = require('../models/Transaction');
const BankFile = require('../models/BankFile');
const User = require('../models/User');

async function stats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        for (const u of users) {
            const txCount = await Transaction.countDocuments({ companyCode: u.companyCode });
            const fileCount = await BankFile.countDocuments({ companyCode: u.companyCode });
            console.log(`Company: ${u.companyCode} | User: ${u.username} | Files: ${fileCount} | Txs: ${txCount}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
stats();
