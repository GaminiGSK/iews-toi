const mongoose = require('mongoose');
const path = require('path');
const BankFile = require('../models/BankFile');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { uploadFile } = require('../services/googleDrive');

async function automateSync() {
    try {
        console.log("🚀 Starting Automated Bank Statement Sync...");
        await mongoose.connect(process.env.MONGODB_URI);

        const stuckFiles = await BankFile.find({
            companyCode: 'GK_SMART_AI',
            driveId: { $in: [null, ""] }
        });

        console.log(`Found ${stuckFiles.length} files requiring sync.`);

        for (const file of stuckFiles) {
            console.log(`Syncing: ${file.originalName} (${file._id})`);

            // Note: We don't have the local file path anymore if it was deleted.
            // But if it's 'Processed' and 'driveId' is missing, it means it was analyzed 
            // but the original upload failed. 
            // Since the local file is likely gone, we use the Metadata-Only fallback directly.

            try {
                // If the user has a specific folder ID, use it.
                const User = require('../models/User');
                const user = await User.findById(file.user);
                const targetFolderId = user?.bankStatementsFolderId || user?.driveFolderId;

                console.log(`Creating metadata record in Drive for ${file.originalName}...`);

                // We fake a "upload" that triggers the metadata fallback because we lack the physical file
                // Or we can just call uploadFileMetadataOnly if we exported it, which we did.
                const { uploadFileMetadataOnly } = require('../services/googleDrive');
                const driveData = await uploadFileMetadataOnly(
                    file.originalName,
                    targetFolderId,
                    `🔄 Auto-Recovered Ledger Sync | Date Range: ${file.dateRange || 'Unknown'}`
                );

                file.driveId = driveData.id;
                file.path = `drive:${driveData.id}`;
                file.isMetadataOnly = true;
                file.syncError = "Auto-Recovered via Metadata Fallback (Original File Unavailable)";
                await file.save();

                console.log(`✅ Recovered ${file.originalName} (ID: ${driveData.id})`);
            } catch (err) {
                console.error(`❌ Recovery failed for ${file.originalName}:`, err.message);
                file.syncError = `Recovery Attempt Failed: ${err.message}`;
                await file.save();
            }
        }

        console.log("🏁 Auto-Sync Task Completed.");
        process.exit(0);
    } catch (error) {
        console.error("Critical Sync Error:", error);
        process.exit(1);
    }
}

automateSync();
