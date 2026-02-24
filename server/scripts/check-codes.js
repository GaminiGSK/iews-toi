const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BankFile = require('../models/BankFile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const codes = await BankFile.distinct('companyCode');
        console.log('Company Codes in BankFile:', codes);

        for (const c of codes) {
            const count = await BankFile.countDocuments({ companyCode: c });
            console.log(`Code: ${c} | Count: ${count}`);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
