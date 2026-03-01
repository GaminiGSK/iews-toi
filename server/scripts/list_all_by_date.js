const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listAll() {
    try {
        console.log("Listing ALL files (including those without specific parents in our root)...");
        const res = await drive.files.list({
            q: "trashed = false",
            fields: 'files(id, name, mimeType, parents, modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: 50
        });

        res.data.files.forEach(f => {
            console.log(`- ${f.name} (${f.id}) | Modified: ${f.modifiedTime} | Parents: ${f.parents ? f.parents.join(',') : 'NONE'}`);
        });
    } catch (err) {
        console.error(err);
    }
}

listAll();
