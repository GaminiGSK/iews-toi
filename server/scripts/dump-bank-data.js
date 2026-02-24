const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BankFile = require('../models/BankFile');
const Transaction = require('../models/Transaction');

async function dump() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const files = await BankFile.find({ companyCode: 'GK_SMART_AI' });
        console.log(`Found ${files.length} files for GK_SMART_AI`);

        for (const f of files) {
            console.log(`--- File: ${f.originalName} ---`);
            console.log(`  ID: ${f._id}`);
            console.log(`  DriveId: ${f.driveId}`);
            console.log(`  DateRange: ${f.dateRange}`);
            console.log(`  Status: ${f.status}`);

            const matchingTxs = await Transaction.countDocuments({
                companyCode: 'GK_SMART_AI',
                'originalData.driveId': f.driveId
            });
            console.log(`  Matching Txs by DriveId: ${matchingTxs}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
dump();
