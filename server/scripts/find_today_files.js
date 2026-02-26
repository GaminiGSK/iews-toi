const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function findTodayFiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const BankFile = mongoose.connection.db.collection('bankfiles');

        const files = await BankFile.find({
            uploadedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }).toArray();

        console.log(`Found ${files.length} files from today.`);
        for (let f of files) {
            console.log(`- ID: ${f._id}, Name: ${f.originalName}, Range: ${f.dateRange}, Drive: ${f.driveId}`);
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
findTodayFiles();
