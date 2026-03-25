require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const CompanyProfile = require('./models/CompanyProfile');
    const BankFile = require('./models/BankFile');
    const Transaction = require('./models/Transaction');
    const AccountCode = require('./models/AccountCode');

    console.log("Merging ARKAN into ARAKAN...");

    // 1. Delete all duplicate ARAKAN data first
    const resTxDel = await Transaction.deleteMany({ companyCode: 'ARAKAN' });
    const resProfDel = await CompanyProfile.deleteMany({ companyCode: 'ARAKAN' });
    const resUserDel = await User.deleteMany({ companyCode: 'ARAKAN' });
    const resAcdDel = await AccountCode.deleteMany({ companyCode: 'ARAKAN' });
    console.log(`Deleted ${resTxDel.deletedCount} txs, ${resUserDel.deletedCount} users, ${resProfDel.deletedCount} profiles, ${resAcdDel.deletedCount} account codes from ARAKAN`);

    // 3. Rename ARKAN to ARAKAN
    const users = await User.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    const profs = await CompanyProfile.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    const files = await BankFile.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    const txs = await Transaction.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    const acs = await AccountCode.updateMany({ companyCode: 'ARKAN' }, { $set: { companyCode: 'ARAKAN' } });
    
    console.log(`Migrated: Users(${users.modifiedCount}), Profiles(${profs.modifiedCount}), BankFiles(${files.modifiedCount}), Txs(${txs.modifiedCount}), Codes(${acs.modifiedCount})`);

    console.log("Migration complete!");
    process.exit(0);
});
