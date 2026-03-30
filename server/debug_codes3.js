require('dotenv').config();
const mongoose = require('mongoose');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const AccountCode = require('./models/AccountCode');
    
    // Group count by companyCode
    const counts = await AccountCode.aggregate([
        { $group: { _id: '$companyCode', count: { $sum: 1 } } }
    ]);
    console.log('Account Codes per Company:', counts);
    process.exit(0);
}
debug();
