const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function createSimple() {
    const parentId = "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW"; // TOI FOAM
    try {
        console.log(`Attempting simple folder creation in ${parentId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'PERMISSION_TEST_FOLDER',
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId]
            },
            fields: 'id'
        });
        console.log(`✅ SUCCESS: ${res.data.id}`);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

createSimple();
