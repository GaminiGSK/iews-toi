const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const { google } = require('googleapis');

async function cleanSlate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) {
            console.error("User GKSMART not found");
            process.exit(1);
        }

        const profile = await CompanyProfile.findOne({ user: user._id });
        if (!profile) {
            console.log("No profile found for GKSMART.");
            process.exit(0);
        }

        console.log(`Initial document count: ${profile.documents.length}`);

        // 1. Collect Drive IDs for deletion
        const driveIdsToDelete = profile.documents
            .filter(d => d.rawText && d.rawText.includes("failed"))
            .map(d => {
                if (d.path && d.path.startsWith('drive:')) {
                    return d.path.split(':')[1];
                }
                return null;
            })
            .filter(id => id !== null);

        // 2. Remove failed documents from DB
        profile.documents = profile.documents.filter(d => !d.rawText || !d.rawText.includes("failed"));
        await profile.save();
        console.log(`Cleaned DB. Current document count: ${profile.documents.length}`);

        // 3. Delete from Google Drive
        if (driveIdsToDelete.length > 0) {
            console.log(`Deleting ${driveIdsToDelete.length} ghost files from Drive...`);
            const auth = new google.auth.GoogleAuth({
                keyFile: path.join(__dirname, '../config/service-account.json'),
                scopes: ['https://www.googleapis.com/auth/drive'],
            });
            const drive = google.drive({ version: 'v3', auth });

            for (const id of driveIdsToDelete) {
                try {
                    await drive.files.delete({ fileId: id });
                    console.log(`  Deleted file: ${id}`);
                } catch (err) {
                    console.error(`  Failed to delete ${id}:`, err.message);
                }
            }
        }

        console.log("System is now CLEAR. Ready for the 5 new REAL files.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
cleanSlate();
