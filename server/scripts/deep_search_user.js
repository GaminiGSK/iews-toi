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
        console.log("Searching for ALL folders shared by the user...");
        const res = await drive.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, size, owners, parents)',
        });

        const allFolders = res.data.files || [];
        const sharedByAdmin = allFolders.filter(f => f.owners && f.owners[0] && !f.owners[0].me);

        console.log(`\n--- Folders Shared by User (Total: ${sharedByAdmin.length}) ---`);
        sharedByAdmin.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Owner: ${f.owners[0].emailAddress}]`);
        });

        // Also search for ANY file created in last 24 hours not owned by SA
        console.log("\nSearching for files created in last 24h NOT owned by SA...");
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const res2 = await drive.files.list({
            q: `createdTime > '${oneDayAgo}' and trashed = false`,
            fields: 'files(id, name, size, owners)',
        });
        const recentShared = (res2.data.files || []).filter(f => f.owners && f.owners[0] && !f.owners[0].me);
        recentShared.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size || '0'}] [Owner: ${f.owners[0].emailAddress}]`);
        });

    } catch (err) {
        console.error(err);
    }
}
search();
