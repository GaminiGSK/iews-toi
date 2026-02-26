const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkFolder() {
    try {
        console.log('Loading Key from: ' + process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log('Requesting folder metadata for: ' + folderId);
        const res = await drive.files.get({
            fileId: folderId,
            fields: 'id, name'
        });
        console.log('SUCCESS: Found ' + res.data.name);
        process.exit(0);
    } catch (err) {
        console.log('ERROR: ' + err.message);
        process.exit(1);
    }
}
checkFolder();
