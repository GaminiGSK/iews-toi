const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkBankFields() {
    try {
        const uri = "mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/test?appName=Cluster0";
        await mongoose.connect(uri);
        const profile = await mongoose.connection.db.collection('companyprofiles').findOne({ companyCode: 'GK_SMART_AI' });

        console.log('Bank Name:', profile.bankName);
        console.log('Account Number:', profile.bankAccountNumber);
        console.log('Account Name:', profile.bankAccountName);
        console.log('Currency:', profile.bankCurrency);

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
checkBankFields();
