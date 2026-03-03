const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listPattern() {
    try {
        const folderId = "1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO";
        const res = await drive.files.list({
            q: `'${folderId}' in parents and name contains '513aad76' and trashed = false`,
            fields: 'files(id, name, size)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        console.log(`Found ${files.length} pattern files.`);
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        files.forEach(f => console.log(`${f.name} | ${f.id}`));
    } catch (err) {
        console.error(err);
    }
}

listPattern();
