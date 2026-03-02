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
        console.log("Searching for ALL files created/modified in the last 12 hours...");
        const twelveHoursAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(); // Wait, 12 hours or 12 days? Let's do 24 hours.
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const res = await drive.files.list({
            q: `modifiedTime > '${oneDayAgo}' and trashed = false`,
            fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, owners, parents)',
            orderBy: 'modifiedTime desc',
            pageSize: 100
        });

        console.log("FILES_JSON_START");
        console.log(JSON.stringify(res.data.files || [], null, 2));
        console.log("FILES_JSON_END");
    } catch (err) {
        console.error(err);
    }
}
search();
