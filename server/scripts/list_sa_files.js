const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listAllServiceAccountFiles() {
    try {
        console.log("Listing all files owned by Service Account...");
        const res = await drive.files.list({
            q: "'toi-system-manager@ambient-airlock-286506.iam.gserviceaccount.com' in owners",
            fields: 'files(id, name, size, mimeType)',
        });
        const files = res.data.files;
        console.log(`Found ${files.length} files.`);
        let totalSize = 0;
        files.forEach(f => {
            const size = parseInt(f.size || 0);
            totalSize += size;
            console.log(`- ${f.name} (${f.mimeType}) [${size} bytes]`);
        });
        console.log(`Total size: ${totalSize} bytes`);
    } catch (err) {
        console.error("Full Error:", JSON.stringify(err, null, 2));
    }
}

listAllServiceAccountFiles();
