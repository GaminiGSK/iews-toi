const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listTexlink(folderId) {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        console.log(`Contents of TEXLINK (${folderId}): ${res.data.files.length}`);
        res.data.files.forEach(f => console.log(`${f.name} | ${f.id} | ${f.mimeType}`));
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    await listTexlink('1ac7QPLGp9oeAoWcBS46wVrpgyv-mWRW4');
    await listTexlink('1MAK903rCYBHvVu8t7SnJsLIX1L51Q51k');
}

run();
