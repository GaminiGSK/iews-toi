const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listMainUploads() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log('--- Listing Main Upload Folder: ' + folderId + ' ---');
        const res = await drive.files.list({
            q: "'" + folderId + "' in parents and trashed = false",
            fields: 'files(id, name, mimeType, createdTime)',
            orderBy: 'createdTime desc'
        });

        const files = res.data.files;
        if (!files || files.length === 0) {
            console.log('No files found.');
        } else {
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                console.log('- ' + f.name + ' (' + f.createdTime + ') [' + f.id + ']');
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listMainUploads();
