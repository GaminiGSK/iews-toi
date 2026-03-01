const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadSpecific() {
    const bankFolderId = "16d27mzpBnEzujvilWvp3-Lgmdt5WBvuD";
    const tempPath = path.join(__dirname, '../uploads/specific_test.txt');
    fs.writeFileSync(tempPath, "SYNC TEST TO GKSMART FOLDER.");

    try {
        console.log(`Uploading to GKSMART Bank Folder ${bankFolderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'TEST_FILE_SYNC.txt',
                parents: [bankFolderId],
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name',
            supportsAllDrives: true
        });
        console.log(`✅ SUCCESS: ${res.data.name} (${res.data.id})`);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

uploadSpecific();
