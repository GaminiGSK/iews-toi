const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function globalSearch() {
    try {
        const res = await drive.files.list({
            q: `name contains 'TOI' and trashed = false`,
            fields: 'files(id, name, mimeType, parents)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        console.log(`GLOBAL SEARCH: Found ${files.length} items with 'TOI'`);
        files.forEach(f => {
            console.log(`${f.name} | ${f.id} | ${f.mimeType} | Parents: ${f.parents?.join(',')}`);
        });
    } catch (err) {
        console.error(err);
    }
}

globalSearch();
