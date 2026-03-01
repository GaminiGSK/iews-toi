const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkId() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fid = '16d27mzpBnEzujvilWvp3-Lgmdt5WBvvuD';
    try {
        const res = await drive.files.get({ fileId: fid, fields: 'id, name, mimeType' });
        console.log("FOUND:", res.data);
    } catch (err) {
        console.error("GET ERROR:", err.message);
    }
    process.exit(0);
}

checkId();
