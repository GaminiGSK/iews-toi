const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkDeleted() {
    try {
        console.log("Searching for 'Deleted' folder...");
        const res = await drive.files.list({
            q: "name = 'Deleted' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name)',
        });

        for (const folder of res.data.files) {
            console.log(`Found Deleted Folder: ${folder.id}`);
            const children = await drive.files.list({
                q: `'${folder.id}' in parents and trashed = false`,
                fields: 'files(id, name)',
            });
            console.log(`Found ${children.data.files.length} children in ${folder.id}.`);
            children.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
        }
    } catch (err) {
        console.error(err);
    }
}

checkDeleted();
