require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const BankFile = require('./models/BankFile');
    const txs = await BankFile.find({ companyCode: 'ARKAN' });
    console.log('ARKAN BankFiles:', txs.map(t => ({id: t._id, name: t.originalName, isLocked: t.isLocked, status: t.status})));
    process.exit(0);
});
