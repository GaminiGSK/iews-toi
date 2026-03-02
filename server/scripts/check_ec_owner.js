const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function check() {
    try {
        const fileId = '1eTivqA0Ld4T-jT-BqXv6yE3iT_iE6TTE'; // One of the ec35cd4e files
        // Wait, I don't have the ID. Let's list one from the subfolder.
        const res = await drive.files.list({
            q: "name contains 'ec35cd4e' and trashed = false",
            fields: 'files(id, name, size, owners)',
            pageSize: 1
        });
        if (res.data.files && res.data.files.length > 0) {
            console.log(JSON.stringify(res.data.files[0], null, 2));
        } else {
            console.log("No ec35cd4e files found.");
        }
    } catch (err) {
        console.error(err);
    }
}
check();
