const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkParents() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const parentIds = ['1Z56h5vAURMvM0Dad9zmcLjO8zeM5AoJf', '1b_ajdruz4LWiY8owfo-H-aWhS_mK50vR'];
    for (const pid of parentIds) {
        try {
            const res = await drive.files.get({ fileId: pid, fields: 'id, name' });
            console.log(`PARENT ID: ${pid} NAME: ${res.data.name}`);
        } catch (err) {
            console.error(`ERROR for ${pid}: ${err.message}`);
        }
    }
    process.exit(0);
}

checkParents();
