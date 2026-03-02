const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function search() {
    try {
        const targetName = "003102780_01Oct2024_31Dec2024_dbdb0bb6-2.jpg";
        console.log(`Searching for all instances of: ${targetName} (including shared with me)`);
        const res = await drive.files.list({
            q: `name = '${targetName}' and trashed = false`,
            fields: 'files(id, name, mimeType, size, parents, owners, shared)',
        });
        console.log("RESULTS_JSON_START");
        console.log(JSON.stringify(res.data.files || [], null, 2));
        console.log("RESULTS_JSON_END");
    } catch (err) {
        console.error(err);
    }
}
search();
