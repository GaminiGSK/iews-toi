const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkBankInfo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const CompanyProfile = mongoose.connection.db.collection('companyprofiles');
        const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });

        if (profile) {
            console.log('--- BANK ACCOUNT INFO ---');
            console.log(`Bank: ${profile.bankName}`);
            console.log(`Account #: ${profile.bankAccountNumber}`);
            console.log(`Account Name: ${profile.bankAccountName}`);
            console.log(`Currency: ${profile.bankCurrency}`);
        } else {
            console.log('Profile not found');
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
checkBankInfo();
