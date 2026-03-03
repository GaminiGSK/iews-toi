const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listBatch() {
    try {
        const folderId = "1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO";
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        console.log(`Knowledge Root Items: ${files.length}`);

        const target = files.find(f => f.name === '513aad76-027.jpg');
        console.log(target ? `Found: ${target.id}` : 'Not found');

        // Let's also search for anything with 'TOI' in the name in this folder
        const toiFiles = files.filter(f => f.name.toLowerCase().includes('toi'));
        console.log(`TOI Files: ${toiFiles.length}`);
        toiFiles.forEach(f => console.log(f.name + ' | ' + f.id));

    } catch (err) {
        console.error(err);
    }
}

listBatch();
