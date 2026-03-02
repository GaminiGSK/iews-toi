const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function findUserFiles() {
    try {
        console.log("Searching for 003102780 files NOT owned by the SA...");
        const res = await drive.files.list({
            q: "name contains '003102780' and trashed = false",
            fields: 'files(id, name, size, owners, parents)',
        });

        const files = res.data.files || [];
        files.forEach(f => {
            const isMe = f.owners && f.owners[0] && f.owners[0].me;
            console.log(`- ${f.name} [ID: ${f.id}] [Owner: ${f.owners[0].emailAddress}] [SA Owned: ${isMe}] [Size: ${f.size || '0'}]`);
            if (f.parents) {
                console.log(`  - Parents: ${f.parents.join(', ')}`);
            }
        });

        if (files.length === 0) console.log("No files found with that name pattern.");

    } catch (err) {
        console.error("Search Error:", err.message);
    }
}
findUserFiles();
