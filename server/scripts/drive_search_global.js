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
        console.log("Searching for RECENTLY CREATED files (last 7 days)...");
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const res = await drive.files.list({
            q: `createdTime > '${sevenDaysAgo}' and trashed = false`,
            fields: 'files(id, name, mimeType, createdTime, parents)',
            orderBy: 'createdTime desc',
            pageSize: 50
        });

        console.log("FILES_JSON_START");
        console.log(JSON.stringify(res.data.files || [], null, 2));
        console.log("FILES_JSON_END");

        console.log("\nSearching for files containing 'GK' or 'SMART'...");
        const res2 = await drive.files.list({
            q: "(name contains 'GK' or name contains 'SMART') and trashed = false",
            fields: 'files(id, name, mimeType, createdTime, parents)',
            pageSize: 50
        });
        console.log("SEARCH_JSON_START");
        console.log(JSON.stringify(res2.data.files || [], null, 2));
        console.log("SEARCH_JSON_END");

        console.log("\nSearching for a folder named 'BR'...");
        const res3 = await drive.files.list({
            q: "name = 'BR' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, parents)',
            pageSize: 50
        });
        console.log("BR_FOLDERS_JSON_START");
        console.log(JSON.stringify(res3.data.files || [], null, 2));
        console.log("BR_FOLDERS_JSON_END");

    } catch (err) {
        console.error(err);
    }
}
search();
