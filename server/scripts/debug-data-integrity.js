require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('--- USERS ---');
        const users = await User.find();
        for (const u of users) {
            const count = await Transaction.countDocuments({ companyCode: u.companyCode });
            console.log(`User: ${u.username} | CompanyCode: [${u.companyCode}] | Tx Count: ${count}`);
        }

        console.log('\n--- ORPHAN TRANSACTIONS? ---');
        // Find Txs that don't match any user company code
        const userCodes = users.map(u => u.companyCode);
        const orphans = await Transaction.countDocuments({ companyCode: { $nin: userCodes } });
        console.log(`Transactions with unknown companyCode: ${orphans}`);

        if (orphans > 0) {
            const sampleOrphans = await Transaction.find({ companyCode: { $nin: userCodes } }).limit(3);
            console.log('Sample Orphan Codes:', sampleOrphans.map(t => t.companyCode));
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugData();
