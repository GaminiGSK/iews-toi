const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listDeep() {
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        const res = await drive.files.list({
            q: `'${rootId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });
        console.log(`Total children of root: ${res.data.files.length}`);
        res.data.files.forEach(f => {
            console.log(`- ${f.name} (${f.id}) [${f.mimeType}]`);
        });
    } catch (err) {
        console.error(err);
    }
}

listDeep();
