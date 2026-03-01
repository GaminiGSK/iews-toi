const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function findNewRoot() {
    try {
        console.log("Searching for 'Blue Agent 2' folder...");
        const res = await drive.files.list({
            q: "name = 'Blue Agent 2' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name)',
        });

        if (res.data.files && res.data.files.length > 0) {
            res.data.files.forEach(f => {
                console.log(`[FOUND] Name: ${f.name} | ID: ${f.id}`);
            });
        } else {
            console.log("Folder not found. Double check sharing settings for the service account email.");
        }
    } catch (err) {
        console.error(err);
    }
}

findNewRoot();
