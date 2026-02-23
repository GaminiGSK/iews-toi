require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    const folderId = "1RwL9lqnObbl1TMvwktcliuffjR4OyVOW";
    try {
        console.log(`Checking access to folder: ${folderId}...`);
        const res = await drive.files.get({
            fileId: folderId,
            supportsAllDrives: true,
        });
        console.log(`✅ Success! Name: ${res.data.name}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
