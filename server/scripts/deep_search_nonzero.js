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
        console.log("Deep Audit: Searching for ANY non-zero files matching BR patterns...");

        // Search for the 6 specific files or similar patterns
        const res = await drive.files.list({
            q: "name contains '003102780' and trashed = false",
            fields: 'files(id, name, size, owners, parents, createdTime)',
        });

        const files = res.data.files || [];
        console.log(`Summary: Found ${files.length} instances of pattern '003102780'`);

        files.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Owner: ${f.owners[0].emailAddress}]`);
            if (parseInt(f.size) > 0) {
                console.log(`  >>> REAL FILE DETECTED! <<<`);
            }
        });

        // Also check if there are any files shared with the SA that have content
        const sharedRes = await drive.files.list({
            q: "sharedWithMe = true and trashed = false",
            fields: 'files(id, name, size, owners)',
            pageSize: 100
        });

        const sharedFiles = sharedRes.data.files || [];
        console.log(`\nShared with me: ${sharedFiles.length} files found.`);
        sharedFiles.filter(f => parseInt(f.size) > 0).slice(0, 10).forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Owner: ${f.owners[0].emailAddress}]`);
        });

    } catch (err) {
        console.error(err);
    }
}
search();
