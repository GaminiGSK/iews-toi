require('dotenv').config();
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
    try {
        console.log("Listing some files to test access...");
        const res = await drive.files.list({
            pageSize: 10,
            fields: 'files(id, name)',
        });
        const files = res.data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }

        const folderName = "Blue Agent Knowledge Base";
        console.log(`Creating '${folderName}' at root...`);
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };
        const folder = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        console.log(`✅ Created Folder ID: ${folder.data.id}`);
        console.log(`\nURL: https://drive.google.com/drive/folders/${folder.data.id}`);

        // Share with anyone with the link (optional, but might be helpful if the user wants to see it)
        // Actually, maybe not for now.
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
