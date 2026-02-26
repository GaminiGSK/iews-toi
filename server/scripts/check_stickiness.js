const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDataStickiness() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');
        const Transaction = mongoose.connection.db.collection('transactions');
        const CompanyProfile = mongoose.connection.db.collection('companyprofiles');

        const companyCode = 'GK_SMART_AI';

        console.log(`--- Persistence Check for ${companyCode} ---`);

        const fileCount = await BankFile.countDocuments({ companyCode });
        console.log(`Bank Files: ${fileCount}`);

        const txCount = await Transaction.countDocuments({ companyCode });
        console.log(`Transactions: ${txCount}`);

        const profile = await CompanyProfile.findOne({ companyCode });
        console.log(`Company Profile: ${profile ? 'EXISTS' : 'MISSING'}`);

        if (fileCount > 0) {
            const latest = await BankFile.find({ companyCode }).sort({ createdAt: -1 }).limit(1).toArray();
            console.log(`Latest File: ${latest[0].originalName}, Status: ${latest[0].status}, Txs: ${latest[0].transactionCount || '?'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkDataStickiness();
