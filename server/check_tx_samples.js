require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    const txsArkan = await Transaction.find({ companyCode: 'ARKAN' }).limit(1);
    const txsArakan = await Transaction.find({ companyCode: 'ARAKAN' }).limit(1);
    console.log('ARKAN sample:', txsArkan[0] ? txsArkan[0].originalData : null);
    console.log('------------------');
    console.log('ARAKAN sample:', txsArakan[0] ? txsArakan[0].originalData : null);
    process.exit(0);
});
