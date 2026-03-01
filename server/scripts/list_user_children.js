const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function list() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fid = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';
    try {
        const res = await drive.files.list({
            q: `'${fid}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)'
        });
        console.log(`\nCHILDREN OF [${fid}]:`);
        res.data.files.forEach(f => {
            console.log(`NAME: ${f.name} | ID: ${f.id} | TYPE: ${f.mimeType}`);
        });
    } catch (e) {
        console.log("ERROR FOR", fid, e.message);
    }
    process.exit(0);
}

list();
