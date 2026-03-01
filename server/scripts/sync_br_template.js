const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function syncBRTemplate() {
    const parentFolderId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H"; // Blue Agent Knowledge Base root
    const localDir = path.resolve(__dirname, '../../knowledge/extracted/BR_Template');
    const folderName = "BR template";

    try {
        console.log(`[Sync] Checking for folder '${folderName}' in Drive...`);

        // 1. Check if folder exists
        const listRes = await drive.files.list({
            q: `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, name)',
        });

        let folderId;
        if (listRes.data.files && listRes.data.files.length > 0) {
            folderId = listRes.data.files[0].id;
            console.log(`[Sync] Folder already exists. ID: ${folderId}`);
        } else {
            // 2. Create the folder if it doesn't exist
            console.log(`[Sync] Creating folder '${folderName}'...`);
            const driveFolder = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId],
                },
                fields: 'id',
            });
            folderId = driveFolder.data.id;
            console.log(`[Sync] Folder created. ID: ${folderId}`);
        }

        // 3. Upload files from local directory
        if (fs.existsSync(localDir)) {
            const files = fs.readdirSync(localDir);
            for (const file of files) {
                const filePath = path.join(localDir, file);
                if (fs.statSync(filePath).isFile()) {
                    console.log(`[Sync] Uploading ${file}...`);

                    const fileCheck = await drive.files.list({
                        q: `'${folderId}' in parents and name = '${file}' and trashed = false`,
                        fields: 'files(id)',
                    });

                    if (fileCheck.data.files && fileCheck.data.files.length > 0) {
                        console.log(`[Sync] File ${file} already exists. Skipping.`);
                        continue;
                    }

                    await drive.files.create({
                        requestBody: {
                            name: file,
                            parents: [folderId],
                        },
                        media: {
                            mimeType: file.endsWith('.md') ? 'text/markdown' : 'application/octet-stream',
                            body: fs.createReadStream(filePath),
                        },
                    });
                    console.log(`[Sync] ${file} uploaded successfully.`);
                }
            }
        }
        console.log(`\n✅ BR template sync complete.`);
    } catch (err) {
        console.error('[Sync] Full Error:', JSON.stringify(err, null, 2));
    }
}

syncBRTemplate();
