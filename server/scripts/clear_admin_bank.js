const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function clearBroken() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');

        console.log('Clearing bank files for ADMIN_GK_SMART...');
        const res = await BankFile.deleteMany({ companyCode: 'ADMIN_GK_SMART' });
        console.log(`Deleted ${res.deletedCount} files.`);

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
clearBroken();
