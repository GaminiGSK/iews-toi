const mongoose = require('mongoose');
require('dotenv').config();

const Transaction = require('./models/Transaction');
const AccountCode = require('./models/AccountCode');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    // 1. Get the account codes for 30100 and 17270
    const code30100 = await AccountCode.findOne({ companyCode: 'GK_SMART_AI', code: '30100' });
    const code17270 = await AccountCode.findOne({ companyCode: 'GK_SMART_AI', code: '17270' });

    console.log("30100 ID:", code30100._id);
    console.log("17270 ID:", code17270._id);

    // 2. Set ALL Money In to 30100
    const resIn = await Transaction.updateMany(
        { companyCode: 'GK_SMART_AI', amount: { $gt: 0 } },
        { $set: { accountCode: code30100._id, code: '30100', tagSource: 'ai' } }
    );
    console.log(`Updated ${resIn.modifiedCount} money in transactions to 30100.`);

    // 3. Set ALL Money Out to 17270
    const resOut = await Transaction.updateMany(
        { companyCode: 'GK_SMART_AI', amount: { $lt: 0 } },
        { $set: { accountCode: code17270._id, code: '17270', tagSource: 'ai' } }
    );
    console.log(`Updated ${resOut.modifiedCount} money out transactions to 17270.`);

    process.exit(0);
});
