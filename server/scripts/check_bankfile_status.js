const mongoose = require('mongoose');
require('dotenv').config();
const BankFile = require('../models/BankFile');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const files = await BankFile.find({});
        console.log(`BankFile count: ${files.length}`);

        files.slice(0, 10).forEach(f => {
            console.log(`- ${f.originalName} | Status: ${f.status} | Text Len: ${f.extractedData?.length || 0}`);
            if (f.errorMessage) console.log(`  >>> ERROR: ${f.errorMessage}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
