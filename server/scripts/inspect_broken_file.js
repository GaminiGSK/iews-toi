const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspectFile() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');
        const file = await BankFile.findOne({ originalName: /003102780_01Oct2024/ });

        if (file) {
            console.log('--- FILE DETAILS ---');
            console.log(JSON.stringify(file, null, 2));
        } else {
            console.log('File not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspectFile();
