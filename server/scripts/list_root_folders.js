const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listFolders() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        const res = await drive.files.list({
            q: `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, name)'
        });
        console.log("Folders in Root:", res.data.files);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

listFolders();
