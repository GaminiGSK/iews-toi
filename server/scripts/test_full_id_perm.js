const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testPerm() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fullId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';
    try {
        console.log(`Checking FULL ID: [${fullId}]`);
        const res = await drive.files.get({ fileId: fullId, fields: 'id, name, permissions' });
        console.log("SUCCESS:", JSON.stringify(res.data.permissions, null, 2));
    } catch (e) {
        console.log("FAILED:", e.message);
    }
    process.exit(0);
}

testPerm();
