const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function uploadProof() {
    const bankFolderId = "16d27mzpBnEzujvilWvp3-Lgmdt5WBvuD";

    // Create a small placeholder 'image' text file but named .jpg
    const tempPath = path.join(__dirname, '../uploads/proof.jpg');
    fs.writeFileSync(tempPath, "SYNC PROOF: BR Template Connection Active.");

    try {
        console.log(`Uploading proof to folder ${bankFolderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'SYSTEM_SYNC_ACTIVE.jpg',
                parents: [bankFolderId],
            },
            media: {
                mimeType: 'image/jpeg',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name',
        });
        console.log(`✅ Upload SUCCESS: ${res.data.name} (${res.data.id})`);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error(err);
    }
}

uploadProof();
