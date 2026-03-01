const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkSub() {
    const bankFolderId = "16d27mzpBnEzujvilWvp3-Lgmdt5WBvuD";
    try {
        const res = await drive.files.list({
            q: `'${bankFolderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });
        console.log(`Contents of GKSMART Bank Statements (${bankFolderId}):`);
        if (res.data.files.length === 0) {
            console.log("No files found.");
        } else {
            res.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
        }
    } catch (err) {
        console.error(err);
    }
}

checkSub();
