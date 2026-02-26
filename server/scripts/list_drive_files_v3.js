const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listDriveFiles() {
    process.chdir(path.join(__dirname, '..')); // Move to server/
    console.log('Working Directory:', process.cwd());

    try {
        const keyPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || 'config/service-account.json');
        console.log('Key Path:', keyPath);
        if (!fs.existsSync(keyPath)) {
            console.error('Key file not found!');
            process.exit(1);
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log(`Searching Folder: ${folderId}`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, createdTime, mimeType)',
            orderBy: 'createdTime desc'
        });

        const files = res.data.files;
        if (files.length === 0) {
            console.log('No files found in Drive folder.');
        } else {
            console.log(`Found ${files.length} files:`);
            files.forEach(f => {
                console.log(`- ${f.name} (ID: ${f.id}, Created: ${f.createdTime})`);
            });
        }
        process.exit(0);
    } catch (err) {
        console.error('Drive Error:', err.message);
        process.exit(1);
    }
}
listDriveFiles();
