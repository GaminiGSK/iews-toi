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
        const folderId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH'; // GKSMART Bank Statements
        console.log(`Checking Bank Statements folder: ${folderId}`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, size, createdTime)',
        });
        const files = res.data.files || [];
        console.log(`Found ${files.length} files.`);
        files.slice(0, 10).forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size || '0'}]`);
        });
    } catch (err) {
        console.error(err);
    }
}
check();
