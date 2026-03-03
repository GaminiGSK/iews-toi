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

    console.log("Searching for any 'GK_SMART' or 'GKSMART' files in trash...");
    const trashRes = await drive.files.list({
        q: "trashed = true and (name contains 'GK_SMART' or name contains 'GKSMART')",
        fields: 'files(id, name, mimeType, trashedTime)'
    });

    console.log("Trash results:", JSON.stringify(trashRes.data.files, null, 2));

    console.log("\nSearching for files with parents changed recently...");
    // We can't easily query by parents change, but we can search for the documents by name
    const docNames = [
        'MOC Cert GK_SMART-50015732-1.jpg',
        'Extract english -GK_SMART-50015732-1.jpg',
        'Extract Khemer GK_SMART-50015732-1.jpg',
        '2025 Patent -1.jpg'
    ];

    for (let name of docNames) {
        const res = await drive.files.list({
            q: `name = '${name}'`,
            fields: 'files(id, name, parents, trashed)'
        });
        console.log(`Search result for ${name}:`, JSON.stringify(res.data.files, null, 2));
    }
}

main().catch(console.error);
