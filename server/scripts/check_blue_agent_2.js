const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
    try {
        const folderId = '1b_ajdruz4LWiY8owfo-H-aWFqVtogTZo'; // Blue Agent 2
        console.log(`Checking Blue Agent 2: ${folderId}`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, createdTime)',
        });
        console.log("FILES_JSON_START");
        console.log(JSON.stringify(res.data.files || [], null, 2));
        console.log("FILES_JSON_END");
    } catch (err) {
        console.error(err);
    }
}
check();
