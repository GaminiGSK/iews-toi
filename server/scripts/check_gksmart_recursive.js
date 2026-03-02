const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
    try {
        const rootId = '1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo'; // GKSMART root
        console.log(`Deep Dive: Searching GKSMART root (ID: ${rootId})...`);

        async function listRec(folderId, depth = 0) {
            const res = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'files(id, name, size, mimeType)',
            });
            const files = res.data.files || [];
            for (const f of files) {
                const indent = ' '.repeat(depth * 2);
                if (f.mimeType === 'application/vnd.google-apps.folder') {
                    console.log(`${indent}Folder: ${f.name} (ID: ${f.id})`);
                    await listRec(f.id, depth + 1);
                } else {
                    console.log(`${indent}File: ${f.name} (Size: ${f.size}) [ID: ${f.id}]`);
                }
            }
        }
        await listRec(rootId);

    } catch (err) {
        console.error(err);
    }
}
check();
