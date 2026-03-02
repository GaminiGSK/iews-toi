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
        const rootId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH'; // GKSMART bank statements
        console.log(`Deep Dive: Checking GKSMART Bank Stats (ID: ${rootId})...`);

        const filesRes = await drive.files.list({
            q: `'${rootId}' in parents and trashed = false`,
            fields: 'files(id, name, size, createdTime)',
        });
        const files = filesRes.data.files || [];
        console.log(`Found ${files.length} files in this folder.`);
        files.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Created: ${f.createdTime}]`);
        });

    } catch (err) {
        console.error(err);
    }
}
check();
