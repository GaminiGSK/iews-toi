const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkSubOwner() {
    const fileId = "16d27mzpBnEzujvilWvp3-Lgmdt5WBvuD";
    try {
        const res = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, owners, permissions',
            supportsAllDrives: true
        });
        console.log(`Subfolder Name: ${res.data.name}`);
        res.data.owners.forEach(o => {
            console.log(`- Owner: ${o.displayName} (${o.emailAddress})`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

checkSubOwner();
