const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const fullId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';
    const saEmail = 'toi-system-manager@ambient-airlock-286506.iam.gserviceaccount.com';
    try {
        const res = await drive.files.get({ fileId: fullId, fields: 'permissions' });
        const hasSa = res.data.permissions.some(p => p.emailAddress === saEmail);
        console.log(`\nFOLDER: ${fullId}`);
        console.log(`SERVICE ACCOUNT IN PERMS: ${hasSa}`);
        if (hasSa) {
            const myPerm = res.data.permissions.find(p => p.emailAddress === saEmail);
            console.log(`MY ROLE: ${myPerm.role}`);
        } else {
            console.log("ALL PERMS:", res.data.permissions.map(p => p.emailAddress));
        }
    } catch (e) {
        console.log("FAILED:", e.message);
    }
    process.exit(0);
}

check();
