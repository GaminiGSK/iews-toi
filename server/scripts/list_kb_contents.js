require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    const parentId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        console.log(`Listing contents of folder: ${parentId}...`);
        const res = await drive.files.list({
            q: `'${parentId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        if (files.length) {
            console.log('Contents:');
            files.map((file) => {
                console.log(`${file.name} (${file.id}) [${file.mimeType}]`);
            });
        } else {
            console.log('No files found.');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
