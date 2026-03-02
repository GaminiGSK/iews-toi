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
        const folderId = '1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS'; // BR Folder
        console.log(`Checking file types in BR folder: ${folderId}`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, size, mimeType, owners)',
        });
        const files = res.data.files || [];
        files.forEach(f => {
            console.log(`- ${f.name} [Mime: ${f.mimeType}] [Size: ${f.size}] [Owner: ${f.owners[0].emailAddress}]`);
        });
    } catch (err) {
        console.error(err);
    }
}
check();
