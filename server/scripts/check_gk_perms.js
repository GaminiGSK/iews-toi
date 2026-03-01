const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkPerms() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const ids = ['1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo', '1wJbkdDYD8exNw8uarUlOxGQipfGQxuux'];
    for (const id of ids) {
        try {
            console.log(`\nChecking ID: ${id}`);
            const res = await drive.files.get({ fileId: id, fields: 'id, name, permissions' });
            console.log("NAME:", res.data.name);
            console.log("PERMS:", res.data.permissions.map(p => ({ role: p.role, type: p.type, email: p.emailAddress })));
        } catch (e) {
            console.log("ERROR FOR", id, e.message);
        }
    }
    process.exit(0);
}

checkPerms();
