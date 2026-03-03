const { google } = require('googleapis');
require('dotenv').config({ path: '.env' });
const path = require('path');
const fs = require('fs');

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    const drive = google.drive({ version: 'v3', auth });

    console.log("Global search for any files containing 'GK SMART'...");
    const res = await drive.files.list({
        q: "name contains 'GK SMART' and trashed = false",
        fields: 'files(id, name, parents, createdTime)'
    });
    console.log("Results:", JSON.stringify(res.data.files, null, 2));

    console.log("\nSearching for any files containing 'GKSMART'...");
    const res2 = await drive.files.list({
        q: "name contains 'GKSMART' and trashed = false",
        fields: 'files(id, name, parents, createdTime)'
    });
    console.log("Results 2:", JSON.stringify(res2.data.files, null, 2));

    console.log("\nSearching for any files containing 'BR' or 'CR' created before 2026-02-01...");
    const res3 = await drive.files.list({
        q: "(name contains 'BR' or name contains 'CR') and createdTime < '2026-02-01T00:00:00Z' and trashed = false",
        fields: 'files(id, name, parents, createdTime)'
    });
    console.log("Old BR/CR files:", JSON.stringify(res3.data.files, null, 2));
}

main().catch(console.error);
