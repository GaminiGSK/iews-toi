const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listFolderContent() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fid = '1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo';
    try {
        const res = await drive.files.list({
            q: `'${fid}' in parents and trashed = false`,
            fields: 'files(id, name)'
        });
        console.log(`Content of ${fid}:`, res.data.files);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

listFolderContent();
