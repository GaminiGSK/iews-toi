const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkTrash() {
    try {
        console.log("Checking Trash for GKSMART and bank files...");
        const res = await drive.files.list({
            q: "trashed = true",
            fields: 'files(id, name, mimeType, parents)',
        });

        console.log(`Found ${res.data.files.length} items in trash.`);
        res.data.files.forEach(f => {
            if (f.name.toLowerCase().includes('gksmart') || f.name.toLowerCase().includes('bank') || f.name.endsWith('.jpg')) {
                console.log(`- [TRASHED] ${f.name} (${f.id})`);
            }
        });
    } catch (err) {
        console.error(err);
    }
}

checkTrash();
