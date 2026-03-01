const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkOwner() {
    const folderId = "1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO";
    try {
        const res = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, owners',
            supportsAllDrives: true
        });
        console.log(`Folder: ${res.data.name}`);
        res.data.owners.forEach(o => {
            console.log(`- Owner: ${o.displayName} (${o.emailAddress})`);
        });
    } catch (err) {
        console.error(err.message);
    }
}

checkOwner();
