const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function downloadFile() {
    const fileId = "1sq7zLAJtn1mFxEdfGtPaAX81e3qkJrMh"; // ID for 192e7f17-001.jpg
    const dest = fs.createWriteStream(path.resolve(__dirname, '../../client/public/failed_parse_original.jpg'));

    console.log(`Downloading file ${fileId} from Google Drive...`);
    try {
        const res = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        res.data
            .on('end', () => console.log('Download complete. Check client/public/failed_parse_original.jpg'))
            .on('error', err => console.error('Error downloading:', err))
            .pipe(dest);
    } catch (err) {
        console.error('Error accessing Drive:', err.message);
    }
}

downloadFile();
