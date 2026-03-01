const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const files = await BankFile.find({ companyCode: "GK_SMART_AI" });
    files.forEach(f => {
        console.log(`FILE: ${f.originalName} | PATH: ${f.path}`);
    });
    process.exit(0);
}

check();
