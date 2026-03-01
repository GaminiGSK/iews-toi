const mongoose = require('mongoose');
const path = require('path');
const BankFile = require('../models/BankFile');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const nonSynced = await BankFile.find({ companyCode: 'GK_SMART_AI', driveId: { $in: [null, ""] } });
    nonSynced.forEach(f => {
        console.log(`F:${f.originalName}|S:${f.status}|ID:${f._id}`);
    });
    process.exit(0);
}

check();
