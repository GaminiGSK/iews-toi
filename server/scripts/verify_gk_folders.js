const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verifyGKFolders() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const folderIds = ['1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo', '1wJbkdDYD8exNw8uarUlOxGQipfGQxuux'];
    for (const fid of folderIds) {
        try {
            const res = await drive.files.get({ fileId: fid, fields: 'id, name, permissions' });
            console.log(`VERIFIED FOLDER: ${res.data.name} (ID: ${fid})`);
        } catch (err) {
            console.error(`FAILED FOLDER: ${fid} (${err.message})`);
        }
    }
    process.exit(0);
}

verifyGKFolders();
