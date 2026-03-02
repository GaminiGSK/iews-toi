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
        const rootId = '1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H'; // BA Knowledge Base
        console.log(`Deep searching for real files in ${rootId}...`);

        const res = await drive.files.list({
            q: "trashed = false and size > 0",
            fields: 'files(id, name, mimeType, size, parents, owners)',
            pageSize: 100
        });

        const files = res.data.files || [];
        console.log(`Found ${files.length} real files across Drive.`);

        console.log("REAL_FILES_JSON_START");
        console.log(JSON.stringify(files.slice(0, 20), null, 2));
        console.log("REAL_FILES_JSON_END");

    } catch (err) {
        console.error(err);
    }
}
check();
