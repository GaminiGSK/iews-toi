const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listAllFiles(folderId) {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        console.log(`TOTAL FILES in ${folderId}: ${files.length}`);
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        files.forEach(f => {
            console.log(`${f.name} | ${f.id} | ${f.size} bytes`);
        });
    } catch (err) {
        console.error(err);
    }
}

const toiFoamFolder = process.argv[2] || "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW";
listAllFiles(toiFoamFolder);
