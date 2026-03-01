const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listGkChildren() {
    const gkFolderId = "1ZpTcMOZYmzSsqo9CPXYmoOenn1bP"; // GKSMART in Blue Agent 2
    try {
        console.log(`Checking children of GKSMART (${gkFolderId})...`);
        const res = await drive.files.list({
            q: `'${gkFolderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });

        res.data.files.forEach(f => {
            console.log(`- ${f.name} (${f.id}) [${f.mimeType}]`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

listGkChildren();
