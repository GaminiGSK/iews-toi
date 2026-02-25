const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function findKnowledgeFolder() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });

        console.log('Searching for folders containing "Knowledge"...');

        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name contains 'Knowledge' and trashed = false",
            fields: 'files(id, name)',
        });

        const folders = res.data.files;
        if (folders.length === 0) {
            console.log('No folders containing "Knowledge" found.');
        } else {
            for (const folder of folders) {
                console.log(`\n--- Folder: ${folder.name} (${folder.id}) ---`);
                const childrenRes = await drive.files.list({
                    q: `'${folder.id}' in parents and trashed = false`,
                    fields: 'files(id, name, mimeType)',
                });
                if (childrenRes.data.files.length === 0) {
                    console.log('  (Empty folder)');
                } else {
                    childrenRes.data.files.forEach(f => {
                        console.log(`  - ${f.name} (${f.id}) [${f.mimeType}]`);
                    });
                }
            }
        }
    } catch (err) {
        console.error('Error:', err.stack || err.message);
    }
}

findKnowledgeFolder();
