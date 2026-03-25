require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    const tx = await Transaction.find({ companyCode: 'ARAKAN' }).limit(1);
    console.log(tx[0].originalData);
    process.exit(0);
});
