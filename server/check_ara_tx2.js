require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    const tx = await Transaction.find({ companyCode: 'ARAKAN' }).limit(18);
    console.log(tx.map(t => t.originalData.driveId));
    process.exit(0);
});
