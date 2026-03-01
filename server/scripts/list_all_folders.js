const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listAllFolders() {
    try {
        console.log("Listing ALL folders accessible to Service Account...");
        const res = await drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, parents)',
        });

        res.data.files.forEach(f => {
            console.log(`- Folder: "${f.name}" | ID: ${f.id} | Parent: ${f.parents ? f.parents.join(',') : 'NONE'}`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

listAllFolders();
