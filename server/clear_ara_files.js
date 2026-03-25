require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const BankFile = require('./models/BankFile');
    const res = await BankFile.deleteMany({ companyCode: 'ARAKAN' });
    console.log(`Deleted ${res.deletedCount} files.`);
    process.exit(0);
});
