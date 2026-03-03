const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function searchWildcard() {
    try {
        const res = await drive.files.list({
            q: `name contains '27' and trashed = false`,
            fields: 'files(id, name, mimeType, parents)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        console.log(`Global search for '27': ${res.data.files.length}`);
        res.data.files.forEach(f => {
            if (f.mimeType.startsWith('image/')) {
                console.log(`${f.name} | ${f.id} | ${f.parents?.join(',')}`);
            }
        });
    } catch (err) {
        console.error(err);
    }
}

searchWildcard();
