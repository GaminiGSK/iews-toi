const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function purgeAndReset() {
    const parentFolderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        console.log("Listing duplicates...");
        const res = await drive.files.list({
            q: `'${parentFolderId}' in parents and name = 'BR template' and trashed = false`,
            fields: 'files(id, name)',
        });

        for (const f of res.data.files) {
            console.log(`Deleting duplicate: ${f.name} (${f.id})`);
            await drive.files.delete({ fileId: f.id });
        }

        console.log("Creating fresh folder...");
        const folder = await drive.files.create({
            requestBody: {
                name: 'BR template',
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId]
            },
            fields: 'id'
        });
        const folderId = folder.data.id;
        console.log(`Created new folder: ${folderId}`);
    } catch (err) {
        console.error("Full Error:", JSON.stringify(err, null, 2));
    }
}

purgeAndReset();
