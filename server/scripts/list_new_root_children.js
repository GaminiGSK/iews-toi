const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listChildren() {
    const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    try {
        console.log(`Checking children of Blue Agent 2 (${rootId})...`);
        const res = await drive.files.list({
            q: `'${rootId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });

        if (res.data.files.length === 0) {
            console.log("No folders found inside Blue Agent 2.");
        } else {
            res.data.files.forEach(f => {
                console.log(`- ${f.name} (${f.id}) [${f.mimeType}]`);
            });
        }
    } catch (err) {
        console.error(err.message);
    }
}

listChildren();
