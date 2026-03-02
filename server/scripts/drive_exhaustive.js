const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function search() {
    try {
        console.log("Searching for ALL files regardless of parent...");
        const res = await drive.files.list({
            q: "trashed = false",
            fields: 'files(id, name, mimeType, createdTime, parents)',
            orderBy: 'createdTime desc',
            pageSize: 100
        });
        console.log("FULL_FILES_JSON_START");
        console.log(JSON.stringify(res.data.files || [], null, 2));
        console.log("FULL_FILES_JSON_END");
    } catch (err) {
        console.error(err);
    }
}
search();
