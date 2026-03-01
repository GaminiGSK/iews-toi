const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function listDrives() {
    try {
        const res = await drive.teamdrives.list(); // V3 calls them teamdrives
        console.log("Shared Drives Found:", res.data.teamDrives.length);
        res.data.teamDrives.forEach(d => console.log(`- ${d.name} (${d.id})`));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

listDrives();
