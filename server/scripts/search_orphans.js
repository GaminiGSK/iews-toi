const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function searchFolders() {
    try {
        const names = ['GKSMART', 'TEXLINK'];
        for (const name of names) {
            console.log(`Searching for: ${name}`);
            const res = await drive.files.list({
                q: `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name, parents)',
            });
            res.data.files.forEach(f => {
                console.log(`- FOUND: ${f.name} (${f.id}) | Parents: ${f.parents ? f.parents.join(',') : 'NONE'}`);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

searchFolders();
