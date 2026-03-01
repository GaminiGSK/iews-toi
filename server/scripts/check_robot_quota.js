const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkQuota() {
    try {
        const res = await drive.about.get({
            fields: 'storageQuota',
        });
        console.log("Storage Quota Info:");
        console.log(`- Limit: ${res.data.storageQuota.limit}`);
        console.log(`- Usage: ${res.data.storageQuota.usage}`);
        console.log(`- Remaining: ${res.data.storageQuota.limit - res.data.storageQuota.usage}`);
    } catch (err) {
        console.error(err.message);
    }
}

checkQuota();
