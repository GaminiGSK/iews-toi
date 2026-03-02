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
        const rootId = '1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H';
        console.log(`Checking Knowledge Base Root (ID: ${rootId}) for non-zero files...`);

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
                    if (parseInt(f.size) > 0) {
                        console.log(`${indent}File: ${f.name} (Size: ${f.size})`);
                    }
                }
            }
        }
        await listRec(rootId);

    } catch (err) {
        console.error(err);
    }
}
search();
