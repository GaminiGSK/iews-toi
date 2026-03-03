const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listRecursive(folderId, depth = 0) {
    process.stdout.write('  '.repeat(depth) + `📂 ${folderId}\n`);
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        for (const file of res.data.files) {
            process.stdout.write('  '.repeat(depth + 1) + `- ${file.name} (${file.id})\n`);
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                await listRecursive(file.id, depth + 1);
            }
        }
    } catch (e) {
        process.stdout.write('  '.repeat(depth + 1) + `❌ Error: ${e.message}\n`);
    }
}

const gksmartFolder = '1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo';
listRecursive(gksmartFolder);
