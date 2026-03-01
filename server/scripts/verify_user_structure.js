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

async function verifyUserFolders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) return console.log("User not found.");

        console.log(`Verifying folders for ${user.username}:`);
        console.log(`- Main Folder: ${user.driveFolderId}`);
        console.log(`- Bank Statements Sub: ${user.bankStatementsFolderId}`);
        console.log(`- BR Sub: ${user.brFolderId}`);

        if (user.driveFolderId) {
            const res = await drive.files.list({
                q: `'${user.driveFolderId}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
            });
            console.log("Sub-folders found in Drive:");
            res.data.files.forEach(f => console.log(`- ${f.name} (${f.id}) [${f.mimeType}]`));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyUserFolders();
