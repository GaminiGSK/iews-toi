const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function testFolder() {
    const parentFolderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        console.log("Creating folder 'BR template'...");
        const res = await drive.files.create({
            requestBody: {
                name: "BR template",
                mimeType: "application/vnd.google-apps.folder",
                parents: [parentFolderId]
            },
            fields: 'id'
        });
        console.log("Successfully created folder. ID:", res.data.id);
    } catch (err) {
        console.error("Full Error:", JSON.stringify(err, null, 2));
    }
}

testFolder();
