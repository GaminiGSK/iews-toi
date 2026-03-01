const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function findGK() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name contains 'GK'",
            fields: 'files(id, name)'
        });
        res.data.files.forEach(f => {
            console.log(`\nNAME: ${f.name}`);
            console.log(`ID_START: ${f.id.substring(0, 15)}`);
            console.log(`ID_END: ${f.id.substring(15)}`);
        });
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

findGK();
