const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listBrFolder() {
    try {
        const credentialsPath = path.resolve(__dirname, '../../', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = '1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS'; // GKSMART BR Folder

        const res = await drive.files.list({
            q: "'" + folderId + "' in parents and trashed = false",
            fields: 'files(id, name, mimeType, size, createdTime)',
            orderBy: 'createdTime desc'
        });

        const files = res.data.files;
        console.log("FILES_JSON_START");
        console.log(JSON.stringify(files || [], null, 2));
        console.log("FILES_JSON_END");
    } catch (err) {
        console.error('Error:', err.message);
    }
}
listBrFolder();
