const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listKnowledgeSub() {
    try {
        const folderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        console.log(`Children of Knowledge Root (${folderId}): ${files.length}`);
        files.forEach(f => {
            console.log(`${f.name} | ${f.id} | ${f.mimeType}`);
        });
    } catch (err) {
        console.error(err);
    }
}

listKnowledgeSub();
