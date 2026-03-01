const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function count() {
    await mongoose.connect(process.env.MONGODB_URI);
    const counts = await BankFile.aggregate([
        { $group: { _id: "$companyCode", count: { $sum: 1 } } }
    ]);
    console.log("FILES IN DB:");
    counts.forEach(c => console.log(`- ${c._id}: ${c.count} files`));
    process.exit(0);
}

count();
