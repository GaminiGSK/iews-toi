const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const files = await BankFile.find({ companyCode: { $regex: /GKSMART/i } });
    console.log(`TOTAL FILES FOR GKSMART: ${files.length}`);
    files.forEach(f => {
        console.log(`FILE: ${f.originalName} | DRIVE_ID: ${f.driveId || 'NONE'} | PATH: ${f.path}`);
    });
    process.exit(0);
}

check();
