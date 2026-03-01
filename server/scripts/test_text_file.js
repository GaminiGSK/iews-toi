const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createTextFile() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    try {
        console.log("Creating TEXT file...");
        const res = await drive.files.create({
            requestBody: {
                name: "TEXT_CONTENT.txt"
            },
            media: {
                mimeType: 'text/plain',
                body: 'Hello World Content'
            },
            fields: 'id'
        });
        console.log("SUCCESS! ID:", res.data.id);
    } catch (err) {
        console.error("UPLOAD ERROR:", err.message);
    }
    process.exit(0);
}

createTextFile();
