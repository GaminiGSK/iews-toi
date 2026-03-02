const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function search() {
    try {
        console.log("Ultimate Deep Audit: Searching Drive for ANY non-zero images...");
        const res = await drive.files.list({
            q: "mimeType contains 'image/' and size > 100 and trashed = false",
            fields: 'files(id, name, size, owners, parents, createdTime)',
            orderBy: 'createdTime desc',
            pageSize: 50
        });

        const files = res.data.files || [];
        console.log(`Summary: Found ${files.length} non-zero images recently.`);

        files.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Created: ${f.createdTime}]`);
        });

    } catch (err) {
        console.error(err);
    }
}
search();
