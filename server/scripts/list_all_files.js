const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listEverything() {
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        const top = await drive.files.list({
            q: `'${rootId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });

        for (const folder of top.data.files) {
            console.log(`\n--- Folder: ${folder.name} (${folder.id}) ---`);
            const children = await drive.files.list({
                q: `'${folder.id}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
            });
            children.data.files.forEach(f => {
                console.log(`- ${f.name} [${f.mimeType}] (${f.id})`);
                // If it's a folder (like GKSMART), check its children too
                if (f.mimeType === 'application/vnd.google-apps.folder') {
                    // Check subfolders
                }
            });
        }
    } catch (err) {
        console.error(err);
    }
}

listEverything();
