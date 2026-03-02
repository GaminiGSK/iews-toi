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
        console.log("Global Pattern Search: '003102780' across all shared folders...");
        const res = await drive.files.list({
            q: "name contains '003102780' and trashed = false",
            fields: 'files(id, name, size, owners, parents, createdTime)',
            pageSize: 50
        });

        const files = res.data.files || [];
        console.log(`Found ${files.length} instances.`);

        files.forEach(f => {
            console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Owner: ${f.owners[0].emailAddress}]`);
        });

    } catch (err) {
        console.error(err);
    }
}
search();
