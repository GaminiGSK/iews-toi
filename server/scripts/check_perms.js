const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkPerms() {
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";
    try {
        console.log(`Checking permissions for ${rootId}...`);
        const res = await drive.permissions.list({
            fileId: rootId,
            supportsAllDrives: true,
        });
        console.log(`Found ${res.data.permissions.length} permission entries.`);
        res.data.permissions.forEach(p => {
            console.log(`- Role: ${p.role} | Type: ${p.type} | Email: ${p.emailAddress || 'N/A'}`);
        });
    } catch (err) {
        console.error("❌ Permission Check Error:", err.message);
    }
}

checkPerms();
