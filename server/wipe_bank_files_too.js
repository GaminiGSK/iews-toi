require('dotenv').config();
const mongoose = require('mongoose');
const BankFile = require('./models/BankFile');
const BankStatement = require('./models/BankStatement');
const User = require('./models/User');

async function checkAndWipe() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ username: 'GKSMART' });
        const companyCode = users[0].companyCode;
        
        console.log(`Checking DB for ${companyCode}...`);

        const bankFiles = await BankFile.find({ companyCode });
        console.log(`BankFile records found: ${bankFiles.length}`);

        const bankStatements = await BankStatement.find({ companyCode });
        console.log(`BankStatement records found: ${bankStatements.length}`);

        // WIPING
        const fileRes = await BankFile.deleteMany({ companyCode: companyCode });
        console.log(`Wiped ${fileRes.deletedCount} BankFile records.`);

        const stmtRes = await BankStatement.deleteMany({ companyCode: companyCode });
        console.log(`Wiped ${stmtRes.deletedCount} BankStatement records.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
checkAndWipe();
