const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
    try {
        const folderId = '1Av54fiZSZOQlVPB7Npow-pAAQTJSGdvp'; // TEXLINK BR
        console.log(`Checking TEXLINK BR folder: ${folderId}`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, size, mimeType)',
        });
        const files = res.data.files || [];
        console.log(`Found ${files.length} files.`);
        files.forEach(f => {
            console.log(`- ${f.name} [Size: ${f.size}]`);
        });
    } catch (err) {
        console.error(err);
    }
}
check();
