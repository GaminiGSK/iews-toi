const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadRoot() {
    const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const tempPath = path.join(__dirname, '../uploads/new_root_test.txt');
    fs.writeFileSync(tempPath, "NEW HUMAN-OWNED ROOT TEST.");

    try {
        console.log(`Uploading to NEW ROOT ${rootId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'NEW_ROOT_SUCCESS.txt',
                parents: [rootId],
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name',
        });
        console.log(`✅ SUCCESS: ${res.data.name} (${res.data.id})`);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

uploadRoot();
