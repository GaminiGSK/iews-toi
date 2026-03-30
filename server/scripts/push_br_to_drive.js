const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const googleDrive = require('../services/googleDrive');
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

async function run() {
    try {
        console.log('Connecting to DB...', process.env.MONGODB_URI);
        // Fallback for Windows DNS resolving of mongodb+srv
        let uri = process.env.MONGODB_URI;
        if (uri.includes('+srv')) {
            // we will just try using it directly, maybe it works if not we will fail fast
        }
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to DB!');

        const profiles = await CompanyProfile.find({});
        console.log(`Checking ${profiles.length} profiles for missing Drive syncs...`);

        // Temporary directory
        const tmpDir = path.join(__dirname, '../uploads/tmp_sync');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        let syncedCount = 0;

        for (const p of profiles) {
            let user = await User.findById(p.user);
            if (!user) continue;

            let updatedDocs = false;
            let currentBrFolderId = user.brFolderId;

            for (const doc of p.documents) {
                // If the path doesn't start with drive: it hasn't been uploaded to Drive
                if (doc.path && !doc.path.startsWith('drive:') && doc.data) {
                    console.log(`File '${doc.originalName}' for user '${user.username}' is missing Drive sync!`);

                    // 1. Ensure folder exists
                    if (!currentBrFolderId) {
                        try {
                            const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
                            const folderName = `BR_${user.companyCode || user.username}`;
                            let sysFolder = await googleDrive.findFolder(folderName, rootFolderId);
                            if (!sysFolder) {
                                console.log(`Creating folder ${folderName}...`);
                                sysFolder = await googleDrive.createFolder(folderName, rootFolderId);
                            }
                            currentBrFolderId = sysFolder.id;
                            user.brFolderId = currentBrFolderId;
                            await user.save();
                        } catch(dirErr) {
                            console.error("Folder creation failed:", dirErr.message);
                            continue; // skip this document
                        }
                    }

                    // 2. Decode Base64 to physical file temporarily
                    const tmpPath = path.join(tmpDir, doc.originalName || 'document.pdf');
                    fs.writeFileSync(tmpPath, Buffer.from(doc.data, 'base64'));

                    // 3. Upload to Google Drive
                    try {
                        console.log(`Uploading ${doc.originalName} to Drive folder ${currentBrFolderId}...`);
                        const driveData = await googleDrive.uploadFile(tmpPath, doc.mimeType, doc.originalName, currentBrFolderId);
                        const rawDriveId = (typeof driveData === 'object') ? driveData.id : driveData;
                        
                        console.log(`Upload successful -> drive:${rawDriveId}`);
                        doc.path = `drive:${rawDriveId}`; // Update it!
                        updatedDocs = true;
                        syncedCount++;
                    } catch(upErr) {
                        console.error('Upload failed:', upErr.message);
                    } finally {
                        // Cleanup
                        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
                    }
                }
            }

            if (updatedDocs) {
                await p.save();
                console.log(`Saved updated Profile for ${user.username}`);
            }
        }

        console.log(`All done! Synchronized ${syncedCount} backlog documents to Google Drive.`);
        process.exit(0);

    } catch(err) {
        console.error('Fatal Script Error:', err);
        process.exit(1);
    }
}

run();
