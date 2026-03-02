const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function listRecursive(folderId, depth = 0) {
    if (depth > 5) return;
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size, createdTime)',
        });
        const files = res.data.files || [];
        for (const f of files) {
            console.log(`${"  ".repeat(depth)}- ${f.name} [ID: ${f.id}] [Size: ${f.size || 'N/A'}] [Mime: ${f.mimeType}]`);
            if (f.mimeType === 'application/vnd.google-apps.folder') {
                await listRecursive(f.id, depth + 1);
            }
        }
    } catch (err) {
        console.error(`Error listing folder ${folderId}:`, err.message);
    }
}

async function start() {
    console.log("RECURSIVE DRIVE AUDIT START");
    await listRecursive('1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H');
    console.log("RECURSIVE DRIVE AUDIT END");
}
start();
