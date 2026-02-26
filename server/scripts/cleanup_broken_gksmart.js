const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupBrokenBank() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');
        const Transaction = mongoose.connection.db.collection('transactions');

        console.log('Cleaning up broken bank files for GK_SMART_AI...');

        // Find broken files
        const brokenFiles = await BankFile.find({
            companyCode: 'GK_SMART_AI',
            dateRange: 'FATAL_ERR - FATAL_ERR'
        }).toArray();

        const fileIds = brokenFiles.map(f => f._id);
        console.log(`Found ${fileIds.length} broken files ID list.`);

        if (fileIds.length > 0) {
            // Delete associated transactions (if any)
            const txResult = await Transaction.deleteMany({ bankFileId: { $in: fileIds } });
            console.log(`Deleted ${txResult.deletedCount} transactions.`);

            // Delete the files
            const fileResult = await BankFile.deleteMany({ _id: { $in: fileIds } });
            console.log(`Deleted ${fileResult.deletedCount} bank files.`);
        } else {
            // Fallback: Delete all bank files for this company if we just want a clean slate
            const allResult = await BankFile.deleteMany({ companyCode: 'GK_SMART_AI' });
            console.log(`Deleted all ${allResult.deletedCount} bank files for a clean slate.`);
            await Transaction.deleteMany({ companyCode: 'GK_SMART_AI' });
        }

        console.log('Cleanup complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
cleanupBrokenBank();
