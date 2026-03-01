const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadSimple() {
    const folderId = "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW"; // TOI FOAM
    const tempPath = path.join(__dirname, '../uploads/simple_test.txt');
    fs.writeFileSync(tempPath, "SIMPLE FILE SYNC TEST.");

    try {
        console.log(`Uploading file to ${folderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'SIMPLE_SYNC_ACTIVE.txt',
                parents: [folderId],
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

uploadSimple();
