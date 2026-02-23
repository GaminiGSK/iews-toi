require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    const parentId = process.argv[2] || "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        console.log(`Listing contents of folder: ${parentId}...`);
        const res = await drive.files.list({
            q: `'${parentId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files;
        let output = "";
        if (files.length) {
            files.map((file) => {
                output += `${file.name} | ${file.mimeType} | ${file.id}\n`;
            });
        } else {
            output = 'No files found.';
        }
        fs.writeFileSync('folder_content.txt', output);
        console.log('Results written to folder_content.txt');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
