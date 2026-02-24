const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Transaction = require('../models/Transaction');
const BankFile = require('../models/BankFile');

async function wipe() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const companyCode = 'GK_SMART_AI';

        console.log(`Wiping ALL bank data for ${companyCode}...`);

        const txResult = await Transaction.deleteMany({ companyCode });
        const fileResult = await BankFile.deleteMany({ companyCode });

        console.log(`✅ Deleted ${txResult.deletedCount} transactions.`);
        console.log(`✅ Deleted ${fileResult.deletedCount} bank files.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
wipe();
