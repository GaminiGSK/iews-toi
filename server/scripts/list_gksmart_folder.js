const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listFolder(folderId) {
    console.log(`📡 Listing contents of: ${folderId}...`);
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        if (files.length) {
            console.log('Contents:');
            files.forEach((file) => {
                console.log(`- ${file.name} (${file.id}) [${file.mimeType}]`);
            });
        } else {
            console.log('No files found.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

const gksmartFolder = "1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo";
listFolder(gksmartFolder);
