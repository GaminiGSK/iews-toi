const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function moveFoldersToBRTemplate() {
    const brTemplateFolderId = "1stTBxzF6R6Ffw6P1vcTfAhQ8tnbPXoC0"; // ID from previous search
    const blueAgentKbRoot = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";

    try {
        console.log(`[Move] Moving user folders to 'BR template' (${brTemplateFolderId})...`);

        // 1. List user folders in root
        const res = await drive.files.list({
            q: `'${blueAgentKbRoot}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id, name, parents)',
        });

        const foldersToMove = res.data.files.filter(f =>
            f.name !== 'BR template' &&
            f.name !== 'TOI FOAM' &&
            f.name !== 'Financial Statement preperation' &&
            f.name !== 'Book keeping knowledge '
        );

        console.log(`Found ${foldersToMove.length} folders to move.`);

        for (const folder of foldersToMove) {
            console.log(`Moving ${folder.name} (${folder.id})...`);

            // Move file to new parent
            await drive.files.update({
                fileId: folder.id,
                addParents: brTemplateFolderId,
                removeParents: blueAgentKbRoot,
                fields: 'id, parents',
                supportsAllDrives: true
            });
            console.log(`✅ Moved ${folder.name}`);
        }

        console.log("\nDONE! User folders are now inside 'BR template'.");
    } catch (err) {
        console.error('[Move] Error:', err.message);
    }
}

moveFoldersToBRTemplate();
