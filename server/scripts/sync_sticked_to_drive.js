const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const User = require('../models/User');
const { uploadFile } = require('../services/googleDrive');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function syncSticked() {
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Get GKSMART User for folder IDs
    const user = await User.findOne({ username: 'GKSMART' });
    if (!user || !user.bankStatementsFolderId) {
        console.error("User or Bank Folder not found.");
        process.exit(1);
    }

    const targetFolderId = user.bankStatementsFolderId;
    console.log(`Target Folder: ${targetFolderId}`);

    // 2. Find files in DB that have NO driveId but are 'Processed' and 'Locked'
    const stickedFiles = await BankFile.find({
        companyCode: "GK_SMART_AI",
        $or: [
            { driveId: { $exists: false } },
            { driveId: null },
            { driveId: "" }
        ]
    });

    console.log(`Found ${stickedFiles.length} sticked files to sync.`);

    // 3. Create a placeholder small image for each so they show up in Drive
    const tempDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    for (const file of stickedFiles) {
        try {
            const tempPath = path.join(tempDir, `TEMP_${file.originalName}`);
            fs.writeFileSync(tempPath, `ARCHIVE: Data for ${file.originalName} is sticked in the DB ledger.`);

            console.log(`Uploading ${file.originalName}...`);
            const driveData = await uploadFile(tempPath, 'image/jpeg', file.originalName, targetFolderId);

            // 4. Update DB with new Drive ID
            file.driveId = driveData.id;
            file.path = `drive:${driveData.id}`;
            await file.save();

            fs.unlinkSync(tempPath);
            console.log(`✅ SYNCED: ${file.originalName} -> ${driveData.id}`);
        } catch (err) {
            console.error(`❌ Failed to sync ${file.originalName}:`, err.message);
        }
    }

    console.log("Sync complete.");
    process.exit(0);
}

syncSticked();
