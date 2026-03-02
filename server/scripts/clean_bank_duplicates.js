const mongoose = require('mongoose');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BankFile = require('../models/BankFile');
const User = require('../models/User');

async function cleanBankDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) process.exit(0);

        const bankFiles = await BankFile.find({ user: user._id });
        console.log(`Total Bank Files: ${bankFiles.length}`);

        const authClient = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../config/service-account.json'),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth: authClient });

        const seenHashes = new Set();
        let deletedCount = 0;

        for (const file of bankFiles) {
            // Using a combination of filename and dateRange to identify duplicates
            const fingerprint = `${file.originalName}_${file.dateRange}`;

            if (seenHashes.has(fingerprint)) {
                console.log(`Deleting duplicate bank file: ${file.originalName}`);

                // 1. Delete from Drive if ID exists
                if (file.driveId) {
                    try {
                        await drive.files.delete({ fileId: file.driveId });
                        console.log('  [Drive] Deleted.');
                    } catch (e) {
                        console.log(`  [Drive] Delete failed: ${e.message}`);
                    }
                }

                // 2. Delete from DB
                await BankFile.findByIdAndDelete(file._id);
                deletedCount++;
            } else {
                seenHashes.add(fingerprint);
            }
        }

        console.log(`Cleaned up ${deletedCount} duplicate bank files.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

cleanBankDuplicates();
