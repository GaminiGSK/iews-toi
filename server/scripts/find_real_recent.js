const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function search() {
    try {
        console.log("Searching for ALL files (size > 0) modified in the last 12 hours...");
        const oneDayAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

        const res = await drive.files.list({
            q: `modifiedTime > '${oneDayAgo}' and trashed = false`,
            fields: 'files(id, name, size, owners, modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: 100
        });

        const files = res.data.files || [];
        const realFiles = files.filter(f => parseInt(f.size) > 0);

        console.log(`\n--- Real Recent Files (Total found: ${realFiles.length}) ---`);
        realFiles.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Modified: ${f.modifiedTime}] [Owner: ${f.owners[0].emailAddress}]`);
        });

    } catch (err) {
        console.error(err);
    }
}
search();
