const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createEmptyFile() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    try {
        console.log("Creating EMPTY file...");
        const res = await drive.files.create({
            requestBody: {
                name: "EMPTY.txt"
            },
            fields: 'id'
        });
        console.log("SUCCESS! ID:", res.data.id);
    } catch (err) {
        console.error("UPLOAD ERROR:", err.message);
    }
    process.exit(0);
}

createEmptyFile();
