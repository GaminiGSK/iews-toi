const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function checkFolders() {
    const ids = [
        { name: 'TEXLINK BR', id: '1QQ5RHwnkgLSqO9_hRB6TzY3AXO3Odg38' },
        { name: 'GKSMART BR', id: '1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS' },
        { name: 'TEXLINK BR (Duplicate?)', id: '1Av54fiZSZOQlVPB7Npow-pAAQTJSGdvp' },
        { name: 'GKSMART BR (Duplicate?)', id: '1TT2TDZ7_pkcdLILPomFKf37_p6ssXWZL' }
    ];

    for (const folder of ids) {
        console.log(`\n--- Checking ${folder.name} (${folder.id}) ---`);
        try {
            const res = await drive.files.list({
                q: `'${folder.id}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType, createdTime)',
                orderBy: 'createdTime desc'
            });
            console.log(`Items Found: ${res.data.files.length}`);
            res.data.files.forEach(f => {
                console.log(`[${f.createdTime}] ${f.name} (${f.mimeType})`);
            });
        } catch (err) {
            console.error(`Error checking ${folder.name}: ${err.message}`);
        }
    }
}

checkFolders();
