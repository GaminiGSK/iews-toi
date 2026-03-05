require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { google } = require('googleapis');
const path = require('path');

async function checkDrive() {
    try {
        const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const auth = new google.auth.GoogleAuth({
            keyFile: path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, '../../', keyPath),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const folderId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH'; // The bank statements folder

        const res2 = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(name)',
            pageSize: 100
        });

        console.log(`Total files found: ${res2.data.files.length}`);
        res2.data.files.forEach(f => console.log(`- ${f.name}`));

    } catch (err) {
        console.error("Error accessing Drive:", err);
    }
}

checkDrive();
