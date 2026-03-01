const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fid = '1r0QiQ2LgvhyKEtYRIUbnfN5x1fYjpNtt';
    try {
        const res = await drive.files.list({
            q: `'${fid}' in parents and trashed = false`,
            fields: 'files(id, name)'
        });
        console.log(`FOUND ${res.data.files.length} ITEMS:`);
        res.data.files.forEach(f => console.log(`- ${f.name}`));
    } catch (err) {
        console.error("LIST ERROR:", err.message);
    }
    process.exit(0);
}

check();
