const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadToiFoam() {
    const folderId = "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW";
    const tempPath = path.join(__dirname, '../uploads/toi_test.txt');
    fs.writeFileSync(tempPath, "TOI FOAM SYNC TEST.");

    try {
        console.log(`Uploading to TOI FOAM ${folderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'TOI_SYNC_TEST.txt',
                parents: [folderId],
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name',
            supportsAllDrives: true
        });
        console.log(`✅ TOI FOAM Upload SUCCESS: ${res.data.name} (${res.data.id})`);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error("❌ TOI FOAM Upload Error:", err.message);
    }
}

uploadToiFoam();
