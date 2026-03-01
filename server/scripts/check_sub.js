const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkSub() {
    const subFolderId = "1Z56h5vAURMvM0Dad9zmcLjO8zeM5AoJf"; // Current fresh folder
    try {
        const res = await drive.files.list({
            q: `'${subFolderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });
        console.log(`Contents of BR template (${subFolderId}):`);
        res.data.files.forEach(f => console.log(`- ${f.name} [${f.mimeType}] (${f.id})`));
    } catch (err) {
        console.error(err);
    }
}

checkSub();
