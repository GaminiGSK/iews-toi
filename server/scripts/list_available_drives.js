const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listDrives() {
    try {
        console.log("Listing all accessible Shared Drives...");
        const res = await drive.drives.list();
        res.data.drives.forEach(d => {
            console.log(`- Drive: ${d.name} (${d.id})`);
        });

        console.log("\nSearching for files I OWN specifically...");
        const resFiles = await drive.files.list({
            q: "owners in 'toi-system-manager@ambient-airlock-286506.iam.gserviceaccount.com'",
            fields: 'files(id, name, parents)',
        });
        resFiles.data.files.forEach(f => {
            console.log(`- OWNED FILE: ${f.name} (${f.id}) | Parents: ${f.parents ? f.parents.join(',') : 'NONE'}`);
        });
    } catch (err) {
        console.error(err);
    }
}

listDrives();
