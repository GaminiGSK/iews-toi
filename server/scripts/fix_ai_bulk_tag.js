const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('../models/Transaction');
    const AccountCode = require('../models/AccountCode');
    
    // AI target
    const targetCodeObj = await AccountCode.findOne({ companyCode: "GK_SMART_AI", code: "30100" });
    
    const count = await Transaction.updateMany(
        { companyCode: "GK_SMART_AI", amount: { $gt: 0 } },
        { $set: { accountCode: targetCodeObj._id, tagSource: 'ai' } }
    );
    
    console.log("Updated Transactions to 30100:", count);
    process.exit(0);
});
