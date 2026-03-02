const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function findRealFiles() {
    try {
        console.log("Searching for file '003102780_01Oct2024_31Dec2024_dbdb0bb6-2.jpg' globally...");
        const res = await drive.files.list({
            q: "name = '003102780_01Oct2024_31Dec2024_dbdb0bb6-2.jpg' and trashed = false",
            fields: 'files(id, name, size, owners, parents, createdTime)',
        });

        const files = res.data.files || [];
        console.log(`Found ${files.length} instances.`);
        files.forEach(f => {
            console.log(`- ID: ${f.id} | Size: ${f.size} | Owner: ${f.owners[0].emailAddress} | Created: ${f.createdTime}`);
            if (f.parents) console.log(`  Parents: ${f.parents.join(', ')}`);
        });

    } catch (err) {
        console.error(err);
    }
}
findRealFiles();
