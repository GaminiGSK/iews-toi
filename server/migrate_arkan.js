require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const CompanyProfile = require('./models/CompanyProfile');
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');

    console.log("Migrating ARKAN -> ARAKAN...");

    // Update Users
    const users = await User.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Users Migrated: ${users.modifiedCount}`);

    // Update CompanyProfiles
    const profs = await CompanyProfile.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Profiles Migrated: ${profs.modifiedCount}`);

    // Update BankFiles
    const files = await BankFile.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`BankFiles Migrated: ${files.modifiedCount}`);

    // Update Transactions
    const txs = await Transaction.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Transactions Migrated: ${txs.modifiedCount}`);

    process.exit(0);
});
