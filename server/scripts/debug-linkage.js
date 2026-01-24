const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({});

        console.log(`Checking linkage for: ${user.companyCode}`);

        // 1. Get 2024 Transactions
        const txs = await Transaction.find({
            companyCode: user.companyCode,
            date: { $gte: new Date('2024-01-01'), $lte: new Date('2024-12-31') }
        });

        console.log(`Found ${txs.length} transactions for 2024.`);

        if (txs.length > 0) {
            console.log('Sample Transaction Link Data:', JSON.stringify(txs[0].originalData, null, 2));

            const linked = txs.filter(t => t.originalData && t.originalData.driveId);
            console.log(`Transactions with Drive ID: ${linked.length} / ${txs.length}`);

            if (linked.length > 0) {
                console.log(`Sample Drive ID: ${linked[0].originalData.driveId}`);
            }
        }

        // 2. Check Bank Files (Registry)
        // We need to see if the BankFile collection has matching drive IDs
        // Note: BankFile model is inside CompanyProfile or separate? 
        // Step 9334 showed 'server/models/BankFile.js' exists.
        const BankFile = require('../models/BankFile');
        // Wait, normally BankFile helps here? 
        // Let's verify if there is a BankFile with that ID.

        // Actually, the main concern is why UI doesn't show them.
        // It matches `tx.originalData.driveId` with `file.driveId`.

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
