const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const User = require('../models/User');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function syncMetadata() {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ companyCode: 'GK_SMART_AI' });
    if (!user || !user.bankStatementsFolderId) {
        console.error("User or accessible Bank Folder not found.");
        process.exit(1);
    }

    const folderId = user.bankStatementsFolderId;
    console.log(`Targeting Folder: ${folderId}`);

    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const stickedFiles = await BankFile.find({
        companyCode: "GK_SMART_AI",
        $or: [
            { driveId: { $exists: false } },
            { driveId: null },
            { driveId: "" }
        ]
    });

    console.log(`Found ${stickedFiles.length} sticked entries in DB ledger.`);

    for (const file of stickedFiles) {
        try {
            console.log(`Creating metadata-only entry for: ${file.originalName}`);
            const res = await drive.files.create({
                requestBody: {
                    name: file.originalName,
                    parents: [folderId],
                    description: `ARCHIVE: Metadata-only entry. Full ledger data: ${file._id}`
                },
                fields: 'id'
            });

            file.driveId = res.data.id;
            file.path = `drive:${res.data.id}`;
            await file.save();
            console.log(`✅ SYNCED TO DRIVE: ${file.originalName} -> ${res.data.id}`);
        } catch (err) {
            console.error(`❌ FAILED: ${file.originalName}:`, err.message);
        }
    }

    console.log("Sync process finished.");
    process.exit(0);
}

syncMetadata();
