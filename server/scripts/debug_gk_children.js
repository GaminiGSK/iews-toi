const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function debugGk() {
    const gkFolderId = "1ZpTcMOZYmzSsqo9CPXYmoOenn1bP"; // GKSMART from previous search
    try {
        console.log(`Auditing children of GKSMART (${gkFolderId})...`);
        const res = await drive.files.list({
            q: `'${gkFolderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });

        res.data.files.forEach(f => {
            console.log(`- FOUND: "${f.name}" | ID: ${f.id} | MIME: ${f.mimeType}`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

debugGk();
