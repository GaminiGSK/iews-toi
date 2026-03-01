const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function listBookkeeping() {
    const folderId = "1fUQCFf1LLFb8krzBMoB6RFYu6YEvdVNB";
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name)',
        });
        console.log(`Contents of Book keeping knowledge (${folderId}):`);
        res.data.files.forEach(f => console.log(`- ${f.name} (${f.id})`));
    } catch (err) {
        console.error(err);
    }
}

listBookkeeping();
