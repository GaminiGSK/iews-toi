const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
    try {
        const fileId = '1tnRfGlQTKCHuw9NkhSMR5xDI1rWUBT0L'; // One of the 003102780 files
        console.log(`Attempting to download file content for ${fileId}...`);

        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const buffer = await new Promise((resolve, reject) => {
            const chunks = [];
            response.data.on('data', chunk => chunks.push(chunk));
            response.data.on('error', reject);
            response.data.on('end', () => resolve(Buffer.concat(chunks)));
        });

        console.log(`DOWNLOAD SUCCESS. Final Buffer Length: ${buffer.length}`);
        if (buffer.length > 0) {
            console.log(`First 20 bytes (hex): ${buffer.slice(0, 20).toString('hex')}`);
        }
    } catch (err) {
        console.error("DOWNLOAD FAILED:", err.message);
    }
}
check();
