const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function finalVerification() {
    const bankFolderId = "1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH"; // User Owned bank statements
    const tempPath = path.join(__dirname, '../uploads/verification_success.txt');
    fs.writeFileSync(tempPath, "CONNECTION VERIFIED: HUMAN-OWNED STORAGE ACTIVE.");

    try {
        console.log(`Uploading verification file to folder ${bankFolderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'CONNECTION_VERIFIED_SUCCESS.txt',
                parents: [bankFolderId],
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name',
        });
        console.log(`✅ SYNC SUCCESS: ${res.data.name} (${res.data.id})`);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error("❌ SYNC FAILED:", err.message);
    }
}

finalVerification();
