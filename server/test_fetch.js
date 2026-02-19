const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testFetch() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./models/User');
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');

    const user = await User.findOne({ username: 'GKSMART' });
    console.log('User:', user.username, 'Code:', user.companyCode);

    const files = await BankFile.find({ companyCode: user.companyCode });
    const txs = await Transaction.find({ companyCode: user.companyCode });

    console.log('Files Count:', files.length);
    console.log('Transactions Count:', txs.length);

    if (files.length > 0) {
        console.log('First File Drive ID:', files[0].driveId);
    }

    if (txs.length > 0) {
        console.log('First Tx originalData.driveId:', txs[0].originalData?.driveId);
    }

    process.exit();
}

testFetch();
