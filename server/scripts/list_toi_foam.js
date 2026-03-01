const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listToiFoam() {
    const toiFoamId = "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW";
    try {
        const res = await drive.files.list({
            q: `'${toiFoamId}' in parents and trashed = false`,
            fields: 'files(id, name)',
        });
        console.log(`Contents of TOI FOAM (${toiFoamId}):`);
        res.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
    } catch (err) {
        console.error(err);
    }
}

listToiFoam();
