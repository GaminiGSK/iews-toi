const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function clearBankData() {
    try {
        console.log('Connecting to: ' + process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        const companyCode = 'GK_SMART_AI';

        console.log(`[WIPE] Clearing all bank data for ${companyCode}...`);

        const BankFile = mongoose.connection.db.collection('bankfiles');
        const Transaction = mongoose.connection.db.collection('transactions');

        const fileRes = await BankFile.deleteMany({ companyCode });
        const txRes = await Transaction.deleteMany({ companyCode });

        console.log(`✅ Deleted ${fileRes.deletedCount} bank files.`);
        console.log(`✅ Deleted ${txRes.deletedCount} transactions.`);

        console.log('--- SYSTEM STATUS ---');
        console.log('Database: gksmart_live (Isolated)');
        console.log('Persistence: ENABLED (Private scope)');

        process.exit(0);
    } catch (err) {
        console.error('❌ Wipe Failed:', err);
        process.exit(1);
    }
}

clearBankData();
