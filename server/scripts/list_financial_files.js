const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listFiles(folderId) {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        console.log(`Folder ${folderId} contains ${files.length} files.`);
        files.forEach(f => {
            console.log(`- ${f.name} (${f.id}) [${f.mimeType}] - Size: ${f.size}`);
        });
    } catch (err) {
        console.error(err);
    }
}

const folderId = "1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO";
listFiles(folderId);
