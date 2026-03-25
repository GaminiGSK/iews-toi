require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');
    const files = await BankFile.find({ companyCode: 'ARAKAN' });
    const txs = await Transaction.countDocuments({ companyCode: 'ARAKAN' });
    console.log('BankFiles for ARAKAN:', files.length);
    console.log('Transactions for ARAKAN:', txs);
    process.exit(0);
});
