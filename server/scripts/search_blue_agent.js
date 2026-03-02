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
        console.log("Searching for 'Blue Agent' folders...");
        const res = await drive.files.list({
            q: "name contains 'Blue Agent' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name, owners, createdTime)',
        });

        const folders = res.data.files || [];
        console.log(`Found ${folders.length} folders.`);

        for (const f of folders) {
            console.log(`- Folder: ${f.name} (ID: ${f.id}) Owner: ${f.owners[0].emailAddress}`);
            // List top 10 files in each folder
            const filesRes = await drive.files.list({
                q: `'${f.id}' in parents and trashed = false`,
                fields: 'files(id, name, size)',
                pageSize: 10
            });
            const files = filesRes.data.files || [];
            console.log(`  Preview: ${files.length} files found.`);
            files.forEach(file => console.log(`   - ${file.name} (Size: ${file.size})`));
        }

    } catch (err) {
        console.error(err);
    }
}
search();
