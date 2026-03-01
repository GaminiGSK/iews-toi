const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkFileOwner() {
    const fileId = "1zrrpkDJVIJlsL7mT3DA";
    try {
        const res = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, owners',
            supportsAllDrives: true
        });
        console.log(`File: ${res.data.name}`);
        res.data.owners.forEach(o => {
            console.log(`- Owner: ${o.displayName} (${o.emailAddress})`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

checkFileOwner();
