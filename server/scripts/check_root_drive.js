const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkRoot() {
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        const res = await drive.files.get({
            fileId: rootId,
            fields: 'id, name, driveId',
            supportsAllDrives: true
        });
        console.log(`Root Info: ${res.data.name} | DriveId: ${res.data.driveId || 'NONE'}`);
    } catch (err) {
        console.error(err.message);
    }
}

checkRoot();
