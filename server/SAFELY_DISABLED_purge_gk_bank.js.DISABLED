const mongoose = require('mongoose');
require('dotenv').config();

async function purgeBankData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const companyCode = 'GK_SMART_AI';

        console.log(`[Purge] Starting wipe for company: ${companyCode}...`);

        const BankFile = require('./models/BankFile');
        const Transaction = require('./models/Transaction');

        const fileCount = await BankFile.countDocuments({ companyCode });
        const txCount = await Transaction.countDocuments({ companyCode });

        console.log(`[Purge] Found ${fileCount} files and ${txCount} transactions.`);

        const fileRes = await BankFile.deleteMany({ companyCode });
        const txRes = await Transaction.deleteMany({ companyCode });

        console.log(`[Purge] Deleted ${fileRes.deletedCount} files.`);
        console.log(`[Purge] Deleted ${txRes.deletedCount} transactions.`);

        console.log('✅ DATABASE WIPED FOR GK_SMART_AI. Ready for fresh upload.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Purge Failed:', err);
        process.exit(1);
    }
}

purgeBankData();
