const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('../models/Transaction');
    const db = mongoose.connection.db;
    
    // Check how many have amount > 0
    const count = await Transaction.countDocuments({ companyCode: "GK_SMART_AI", amount: { $gt: 0 } });
    console.log("Count gt 0:", count);
    
    // Test the update logic
    const AccountCode = require('../models/AccountCode');
    const targetCodeObj = await AccountCode.findOne({ companyCode: "GK_SMART_AI", code: "30100" });
    
    console.log("Target Object ID:", targetCodeObj._id);
    
    const countWith30100 = await Transaction.countDocuments({ companyCode: "GK_SMART_AI", accountCode: targetCodeObj._id });
    console.log("Count currently mapped to 30100:", countWith30100);
    
    process.exit(0);
});
