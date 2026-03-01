const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkRoot() {
    const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    try {
        console.log(`Checking folder access for: ${rootId}`);
        const res = await drive.files.get({
            fileId: rootId,
            fields: 'id, name, permissions',
            supportsAllDrives: true
        });
        console.log(`✅ Accessed folder: ${res.data.name}`);

        const children = await drive.files.list({
            q: `'${rootId}' in parents and trashed = false`,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });
        console.log(`Found ${children.data.files.length} children.`);
        children.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
    } catch (err) {
        console.error("❌ Full Error:", JSON.stringify(err, null, 2));
    }
}

checkRoot();
