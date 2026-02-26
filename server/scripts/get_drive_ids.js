const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function getDriveIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');
        const files = await BankFile.find({ companyCode: 'GK_SMART_AI' }).toArray();
        console.log(`Retrieved ${files.length} files with Drive IDs:`);
        files.forEach(f => {
            console.log(`{ "id": "${f._id}", "driveId": "${f.driveId}", "name": "${f.originalName}" }`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getDriveIds();
