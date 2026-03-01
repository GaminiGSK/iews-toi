const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listJSON() {
    const parentFolderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        const res = await drive.files.list({
            q: `'${parentFolderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });
        fs.writeFileSync('drive_list.json', JSON.stringify(res.data.files, null, 2));
        console.log("Drive list saved to drive_list.json");
    } catch (err) {
        console.error(err);
    }
}

listJSON();
