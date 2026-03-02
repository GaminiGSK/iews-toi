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
        console.log("Global search for 'GK SMART'...");
        const res = await drive.files.list({
            q: "name contains 'GK SMART' and trashed = false",
            fields: 'files(id, name, size, mimeType)',
        });
        const files = res.data.files || [];
        console.log(`Found ${files.length} items.`);
        files.forEach(f => {
            console.log(`- ${f.name} [Size: ${f.size}] [ID: ${f.id}]`);
        });
    } catch (err) {
        console.error(err);
    }
}
check();
