const mongoose = require('mongoose');
const path = require('path');
const BankFile = require('../models/BankFile');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await BankFile.countDocuments({ companyCode: 'GK_SMART_AI' });
    const nonSynced = await BankFile.countDocuments({ companyCode: 'GK_SMART_AI', driveId: { $in: [null, ""] } });
    console.log(`TOTAL:${count}|NON_SYNCED:${nonSynced}`);
    process.exit(0);
}

check();
