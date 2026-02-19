const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');
    const User = require('./models/User');

    const bankStats = await BankFile.aggregate([{ $group: { _id: '$companyCode', count: { $sum: 1 } } }]);
    const txStats = await Transaction.aggregate([{ $group: { _id: '$companyCode', count: { $sum: 1 } } }]);
    const allUsers = await User.find({}, 'username companyCode role loginCode');

    console.log('--- USERS ---');
    allUsers.forEach(u => console.log(`${u.username} (${u.role}) -> ${u.companyCode} [Code: ${u.loginCode}]`));

    console.log('\n--- BANK FILES ---');
    bankStats.forEach(s => console.log(`${s._id}: ${s.count}`));

    console.log('\n--- TRANSACTIONS ---');
    txStats.forEach(s => console.log(`${s._id}: ${s.count}`));

    process.exit();
}

run();
