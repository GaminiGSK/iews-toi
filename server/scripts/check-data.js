require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const BankFile = require('../models/BankFile');
const Transaction = require('../models/Transaction');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const userCount = await User.countDocuments();
        const fileCount = await BankFile.countDocuments();
        const txCount = await Transaction.countDocuments();

        console.log('--- DATA CHECK ---');
        console.log(`Users: ${userCount}`);
        console.log(`BankFiles: ${fileCount}`);
        console.log(`Transactions: ${txCount}`);

        const users = await User.find({}, 'companyCode role email');
        console.log('Users found:', users);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
