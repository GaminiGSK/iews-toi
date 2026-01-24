const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const BankFile = require('../models/BankFile');

async function check() {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const users = await User.find({});
        console.log(`Users Found: ${users.length}`);

        for (const u of users) {
            const txCount = await Transaction.countDocuments({ companyCode: u.companyCode });
            const fileCount = await BankFile.countDocuments({ companyCode: u.companyCode });
            console.log(`User: ${u.companyCode} | Files: ${fileCount} | Tx: ${txCount}`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
