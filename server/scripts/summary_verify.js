const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function verify() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fid = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';
    const res = await drive.files.list({
        q: `'${fid}' in parents and trashed = false`,
        fields: 'files(name)'
    });
    console.log(`GRAND_DRIVE_TOTAL: ${res.data.files.length}`);
    process.exit(0);
}

verify();
