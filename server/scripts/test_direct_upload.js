const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testUpload() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const targetFolderId = '1r0QiQ2LgvhyKEtYRIUbnfN5xx1fYjpNtt';
    const tempPath = path.join(__dirname, '../uploads/TEST.txt');
    fs.writeFileSync(tempPath, "TEST UPLOAD");

    try {
        console.log(`Uploading test file to ${targetFolderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: "TEST_ROOT.txt",
                // parents: [targetFolderId]
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(tempPath)
            },
            fields: 'id'
        });
        console.log("SUCCESS! ID:", res.data.id);
    } catch (err) {
        console.error("UPLOAD ERROR:", err.message);
    }
    fs.unlinkSync(tempPath);
    process.exit(0);
}

testUpload();
