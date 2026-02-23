require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    try {
        console.log("Listing all folders...");
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'files(id, name, parents)',
        });
        const folders = res.data.files;
        if (folders.length) {
            folders.map((f) => {
                console.log(`${f.name} (${f.id}) - Parents: ${f.parents ? f.parents.join(',') : 'none'}`);
            });
        } else {
            console.log('No folders found.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
