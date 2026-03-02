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
        console.log("Searching for keywords: Patent, VAT, Registration, GK...");
        const res = await drive.files.list({
            q: "(name contains 'Patent' or name contains 'VAT' or name contains 'GK') and trashed = false",
            fields: 'files(id, name, size, createdTime, owners)',
            pageSize: 100
        });
        console.log("KEYWORDS_JSON_START");
        console.log(JSON.stringify(res.data.files || [], null, 2));
        console.log("KEYWORDS_JSON_END");
    } catch (err) {
        console.error(err);
    }
}
check();
