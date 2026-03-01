const mongoose = require('mongoose');
const User = require('../models/User');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function cleanupDocs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ driveFolderId: { $exists: true } });

        for (const user of users) {
            console.log(`Organizing docs for ${user.username}...`);

            // List files in root that are NOT our subfolders
            const res = await drive.files.list({
                q: `'${user.driveFolderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name, mimeType)'
            });

            for (const f of res.data.files) {
                let targetId = null;
                if (f.name.toLowerCase().includes('bank') || f.name.toLowerCase().includes('stm')) {
                    targetId = user.bankStatementsFolderId;
                } else {
                    targetId = user.brFolderId; // Default to BR for registration docs
                }

                if (targetId) {
                    console.log(`Moving ${f.name} to its sub-folder...`);
                    await drive.files.update({
                        fileId: f.id,
                        addParents: targetId,
                        removeParents: user.driveFolderId,
                        fields: 'id, parents',
                        supportsAllDrives: true
                    });
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanupDocs();
