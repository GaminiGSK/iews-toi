const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkBankFiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const docs = await mongoose.connection.db.collection('bankfiles').find({}).toArray();
        console.log('--- BANK FILES IN GK_SMART_LIVE ---');
        for (let d of docs) {
            console.log(`- Name: ${d.originalName}, DriveID: ${d.driveId}, Path: ${d.path}, Created: ${d.uploadedAt || d.createdAt}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkBankFiles();
