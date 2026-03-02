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
        const folderId = '1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO'; // FS Prep
        console.log(`Checking FS Prep (ID: ${folderId}) for GKSMART relevant files...`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, size, createdTime)',
        });
        const files = res.data.files || [];
        console.log(`Found ${files.length} files.`);

        // Show first 10
        files.slice(0, 50).forEach(f => {
            console.log(`- ${f.name} [Size: ${f.size}] [Created: ${f.createdTime}] [ID: ${f.id}]`);
        });
    } catch (err) {
        console.error(err);
    }
}
check();
