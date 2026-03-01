const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function finalCheck() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const user = { bankStatementsFolderId: '1r0QiQ2LgvhyKEtYRIUbnfN5xx1fYjpNtt' };
    const fid = user.bankStatementsFolderId;
    try {
        const res = await drive.files.list({
            q: `'${fid}' in parents and trashed = false`,
            fields: 'files(id, name)'
        });
        console.log(`\nFINAL DRIVE CONTENT (${fid}):`);
        res.data.files.forEach(f => console.log(`- ${f.name} (ID: ${f.id})`));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

finalCheck();
