const mongoose = require('mongoose');
const path = require('path');
const BankFile = require('../models/BankFile');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const files = await BankFile.find({ companyCode: 'GK_SMART_AI' });
    const nonSynced = files.filter(f => !f.driveId);
    console.log(`TOTAL NON-SYNCED FILES FOR GK_SMART_AI: ${nonSynced.length}`);
    nonSynced.forEach(f => {
        console.log(`NAME: ${f.originalName} | ID: ${f._id} | STATUS: ${f.status} | DATE: ${f.dateRange}`);
    });
    process.exit(0);
}

check();
