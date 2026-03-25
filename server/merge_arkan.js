require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const CompanyProfile = require('./models/CompanyProfile');
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');

    console.log("Merging ARKAN into ARAKAN...");

    // 1. Delete all duplicate transactions currently under ARAKAN
    const resTxDel = await Transaction.deleteMany({ companyCode: 'ARAKAN' });
    console.log(`Deleted ${resTxDel.deletedCount} duplicate ARAKAN transactions`);

    // 2. Delete the ARAKAN profile/user so we can rename ARKAN
    const resProfDel = await CompanyProfile.deleteMany({ companyCode: 'ARAKAN' });
    const resUserDel = await User.deleteMany({ companyCode: 'ARAKAN' });
    console.log(`Deleted ${resUserDel.deletedCount} empty ARAKAN user(s) and ${resProfDel.deletedCount} profile(s)`);

    // 3. Rename ARKAN to ARAKAN
    const users = await User.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Users Migrated: ${users.modifiedCount}`);

    const profs = await CompanyProfile.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Profiles Migrated: ${profs.modifiedCount}`);

    const files = await BankFile.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`BankFiles Migrated: ${files.modifiedCount}`);

    const txs = await Transaction.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Transactions Migrated: ${txs.modifiedCount}`);

    // Update AccountCodes (Chart of Accounts)
    const AccountCode = require('./models/AccountCode');
    const acs = await AccountCode.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    console.log(`Account Codes Migrated: ${acs.modifiedCount}`);

    console.log("Migration complete!");
    process.exit(0);
});
