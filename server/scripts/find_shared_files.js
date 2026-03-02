const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function findSharedFiles() {
    try {
        console.log("Searching for files SHARED WITH the service account (not owned by it)...");
        const res = await drive.files.list({
            q: "trashed = false", // Starting broad
            fields: 'files(id, name, mimeType, size, createdTime, owners, parents)',
            pageSize: 100
        });

        const allFiles = res.data.files || [];
        const sharedWithMe = allFiles.filter(f => f.owners && f.owners[0] && !f.owners[0].me);
        const saOwned = allFiles.filter(f => f.owners && f.owners[0] && f.owners[0].me);

        console.log(`\n--- Files Shared with Me (Total: ${sharedWithMe.length}) ---`);
        sharedWithMe.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Owner: ${f.owners[0].emailAddress}] [Size: ${f.size || '0'}]`);
        });

        console.log(`\n--- Recent Service Account Owned (Total: ${saOwned.length}) ---`);
        saOwned.slice(0, 10).forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size || '0'}]`);
        });

        // Specific search for "BR" folder not owned by SA
        console.log("\nSearching for 'BR' folders not owned by SA...");
        const res2 = await drive.files.list({
            q: "name = 'BR' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, owners, parents)',
        });
        res2.data.files.forEach(f => {
            const isMe = f.owners && f.owners[0] && f.owners[0].me;
            console.log(`- Folder: ${f.name} [ID: ${f.id}] [Owner: ${f.owners[0].emailAddress}] [SA Owned: ${isMe}]`);
        });

    } catch (err) {
        console.error("Search Error:", err.message);
    }
}
findSharedFiles();
