require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');
    
    const arkanFiles = await BankFile.find({ companyCode: 'ARKAN' });
    const arakanFiles = await BankFile.find({ companyCode: 'ARAKAN' });
    
    console.log('ARKAN files:', arkanFiles.length);
    console.log('ARAKAN files:', arakanFiles.length);

    process.exit(0);
});
