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

    console.log("Searching for files with name containing '513' (TOI pages)...");
    const res = await drive.files.list({
        // Search globally
        q: "name contains '513' and trashed = false",
        fields: 'files(id, name, parents, createdTime)'
    });

    const groups = {};
    for (let f of res.data.files) {
        const parentId = f.parents ? f.parents[0] : 'root';
        if (!groups[parentId]) {
            const parentRes = await drive.files.get({ fileId: parentId, fields: 'name' }).catch(() => ({ data: { name: 'Unknown' } }));
            groups[parentId] = { name: parentRes.data.name, count: 0, files: [] };
        }
        groups[parentId].count++;
        groups[parentId].files.push(f.name);
    }
    console.log("Distribution of TOI files:", JSON.stringify(groups, null, 2));

    console.log("\nSearching for any folder with name containing 'Old' or 'Legacy' or 'Backup'...");
    const folderRes = await drive.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and (name contains 'Old' or name contains 'Legacy' or name contains 'Backup')",
        fields: 'files(id, name, parents)'
    });
    console.log("Possible Backup Folders:", JSON.stringify(folderRes.data.files, null, 2));
}

main().catch(console.error);
