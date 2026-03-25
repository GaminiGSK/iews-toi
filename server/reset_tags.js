require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    const res = await Transaction.updateMany(
        { companyCode: 'ARAKAN', tagSource: 'ai' },
        { $unset: { accountCode: "", code: "", tagSource: "" } }
    );
    console.log('Reset:', res.modifiedCount);
    process.exit(0);
});
