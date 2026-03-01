const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function findUserOwnedFolders() {
    const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Blue Agent 2
    try {
        console.log(`Searching under Blue Agent 2 (${rootId})...`);

        // Find GKSMART
        const resGk = await drive.files.list({
            q: `name = 'GKSMART' and '${rootId}' in parents and trashed = false`,
            fields: 'files(id, name)',
        });

        if (resGk.data.files.length > 0) {
            const gkId = resGk.data.files[0].id;
            console.log(`[FOUND GKSMART]: ${gkId}`);

            // Find bank statements
            const resBank = await drive.files.list({
                q: `name = 'bank statements' and '${gkId}' in parents and trashed = false`,
                fields: 'files(id, name)',
            });
            if (resBank.data.files.length > 0) {
                console.log(`[FOUND bank statements]: ${resBank.data.files[0].id}`);
            }

            // Find BR
            const resBr = await drive.files.list({
                q: `name = 'BR' and '${gkId}' in parents and trashed = false`,
                fields: 'files(id, name)',
            });
            if (resBr.data.files.length > 0) {
                console.log(`[FOUND BR]: ${resBr.data.files[0].id}`);
            }
        } else {
            console.log("GKSMART folder not found under Blue Agent 2.");
        }
    } catch (err) {
        console.error(err.message);
    }
}

findUserOwnedFolders();
