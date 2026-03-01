const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function findStickedFiles() {
    // These are the names we saw in the database
    const stickedNames = [
        '10.jpg', '3.jpg', '4.jpg', '7.jpg', '8.jpg', '9.jpg',
        '1 jan march.jpg', '2 Jan March .jpg'
    ];

    try {
        console.log("--- SECURING RECOVERY: Searching entire Drive for sticked source files ---");
        for (const name of stickedNames) {
            const res = await drive.files.list({
                q: `name = '${name.replace(/'/g, "\\'")}' and trashed = false`,
                fields: 'files(id, name, parents, webViewLink)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (res.data.files && res.data.files.length > 0) {
                console.log(`[FOUND] ${name}:`);
                for (const f of res.data.files) {
                    console.log(` - ID: ${f.id} | Parent: ${f.parents ? f.parents.join(',') : 'NONE'}`);
                }
            } else {
                console.log(`[MISSING] ${name}: Not found on Drive.`);
            }
        }
    } catch (err) {
        console.error("Search Error:", err.message);
    }
}

findStickedFiles();
