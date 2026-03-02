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
        const fileId = '1WikZclpAfclL4soSQwbj-YurdmXZZQcm'; // One of the 300KB files
        console.log(`Checking file: ${fileId}`);
        const res = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, size, owners, parents',
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error(err);
    }
}
check();
