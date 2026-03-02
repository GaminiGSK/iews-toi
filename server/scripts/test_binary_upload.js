const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function testUpload() {
    try {
        const folderId = '1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS'; // GKSMART/BR
        const tempPath = path.join(__dirname, '../uploads/binary_test.jpg');
        fs.writeFileSync(tempPath, 'Binary Pixel Data placeholder');

        console.log(`Testing binary upload to ${folderId}...`);
        const res = await drive.files.create({
            requestBody: {
                name: 'binary_test.jpg',
                parents: [folderId],
            },
            media: {
                mimeType: 'image/jpeg',
                body: fs.createReadStream(tempPath),
            },
            fields: 'id, name, size',
        });
        console.log("SUCCESS!", res.data);
        fs.unlinkSync(tempPath);
    } catch (err) {
        console.error("FAIL!", err.message);
        console.error("DEBUG:", JSON.stringify(err.response?.data, null, 2));
    }
}
testUpload();
