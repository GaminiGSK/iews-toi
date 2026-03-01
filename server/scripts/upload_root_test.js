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
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    const tempPath = path.join(__dirname, '../uploads/root_test.txt');
    fs.writeFileSync(tempPath, "ROOT SYNC TEST.");

    try {
        console.log(`Uploading to ROOT ${rootId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'ROOT_SYNC_TEST.txt',
                parents: [rootId],
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name',
            supportsAllDrives: true
        });
        console.log(`✅ Root Upload SUCCESS: ${res.data.name} (${res.data.id})`);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error("❌ Root Upload Error:", err.message);
    }
}

uploadRoot();
