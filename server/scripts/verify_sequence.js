const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function verifyFullSequence() {
    try {
        const folderId = "1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO";
        const missing = [];
        const found = [];

        for (let i = 1; i <= 27; i++) {
            const fileName = `513aad76-${i.toString().padStart(3, '0')}.jpg`;
            const res = await drive.files.list({
                q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
                fields: 'files(id, name)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });

            if (res.data.files.length > 0) {
                found.push({ page: i, id: res.data.files[0].id, name: res.data.files[0].name });
            } else {
                missing.push(i);
            }
        }

        console.log(`Found ${found.length} / 27 pages.`);
        if (missing.length > 0) {
            console.log(`Missing pages: ${missing.join(', ')}`);
        } else {
            console.log("Full sequence 1-27 found!");
        }

    } catch (err) {
        console.error(err);
    }
}

verifyFullSequence();
