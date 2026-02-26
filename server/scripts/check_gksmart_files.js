const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkGksmartStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');
        const User = mongoose.connection.db.collection('users');

        const gksmart = await User.findOne({ loginCode: '666666' });
        if (!gksmart) {
            console.log('User 666666 not found');
            process.exit(1);
        }

        console.log(`User found: ${gksmart.username}, Company: ${gksmart.companyCode}`);

        const files = await BankFile.find({ companyCode: gksmart.companyCode }).toArray();
        console.log(`Found ${files.length} bank files.`);
        files.forEach(f => {
            console.log(`- File: ${f.originalName}, Status: ${f.status}, Range: ${f.dateRange}, ID: ${f._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkGksmartStatus();
