const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testPermission() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const folderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        console.log(`Checking permissions for folder: ${folderId}`);
        const res = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, permissions'
        });
        console.log("Folder Meta:", res.data);
    } catch (err) {
        console.error("PERMISSION ERROR:", err.message);
        if (err.message.includes("File not found")) {
            console.log("The service account likely doesn't have access to this folder.");
        }
    }
    process.exit(0);
}

testPermission();
