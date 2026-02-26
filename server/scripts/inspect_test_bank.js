const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspectTestData() {
    try {
        const uri = "mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/test?appName=Cluster0";
        await mongoose.connect(uri);
        const CompanyProfile = mongoose.connection.db.collection('companyprofiles');
        const BankFile = mongoose.connection.db.collection('bankfiles');

        const profile = await CompanyProfile.findOne({ companyCode: 'GK_SMART_AI' });
        if (profile) {
            console.log('--- TEST PROFILE INFO ---');
            console.log(JSON.stringify(profile, null, 2));
        }

        const files = await BankFile.find({ companyCode: 'GK_SMART_AI' }).toArray();
        if (files.length > 0) {
            console.log('--- TEST BANK FILES ---');
            files.forEach(f => {
                console.log(`- ${f.originalName}, Bank: ${f.bankName}, Acc: ${f.accountNumber}, Range: ${f.dateRange}`);
            });
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
inspectTestData();
