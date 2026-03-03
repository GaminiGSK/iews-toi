const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function searchPages() {
    try {
        const queries = [
            "name = '18-1.jpg'",
            "name = '23-1.jpg'",
            "name = '24-1.jpg'",
            "name = '25-1.jpg'",
            "name = '26-1.jpg'",
            "name = '27-1.jpg'"
        ];

        for (const q of queries) {
            const res = await drive.files.list({
                q: `${q} and trashed = false`,
                fields: 'files(id, name, parents)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });
            console.log(`Search for ${q}: Found ${res.data.files.length}`);
            res.data.files.forEach(f => console.log(`  - ${f.name} | ${f.id} | Parents: ${f.parents?.join(',')}`));
        }
    } catch (err) {
        console.error(err);
    }
}

searchPages();
