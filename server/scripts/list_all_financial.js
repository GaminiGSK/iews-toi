const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listAllRecursive(folderId) {
    let allFiles = [];
    let pageToken = null;
    try {
        do {
            const res = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'nextPageToken, files(id, name, mimeType)',
                pageSize: 1000,
                pageToken: pageToken,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });
            allFiles = allFiles.concat(res.data.files);
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        console.log(`TOTAL FILES in ${folderId}: ${allFiles.length}`);
        // Let's filter for anything that looks like Page 23-27
        const targets = allFiles.filter(f => /23|24|25|26|27/.test(f.name));
        console.log(`FOUND ${targets.length} targets:`);
        targets.forEach(f => console.log(`${f.name} | ${f.id}`));
    } catch (err) {
        console.error(err);
    }
}

listAllRecursive('1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO');
