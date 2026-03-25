require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const BankFile = require('./models/BankFile');
    const files = await BankFile.aggregate([
        { $group: { _id: "$companyCode", count: { $sum: 1 } } }
    ]);
    console.log("BankFiles by Company:");
    console.log(files);
    process.exit(0);
});
