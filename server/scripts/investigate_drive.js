const { google } = require('googleapis');
require('dotenv').config({ path: '.env' });
const path = require('path');
const fs = require('fs');

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
    const drive = google.drive({ version: 'v3', auth });

    const results = {};

    // 1. GKSMART Folders
    const folders = {
        main: "1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo",
        bank: "1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH",
        br: "1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS"
    };

    for (let [name, id] of Object.entries(folders)) {
        console.log(`Checking ${name} folder: ${id}`);
        const res = await drive.files.list({
            q: `'${id}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, createdTime)'
        });
        results[name] = res.data.files;
    }

    // 2. Search for any "TOI" related files globally
    console.log("Searching for TOI files globally...");
    const toiRes = await drive.files.list({
        q: "name contains 'TOI' and trashed = false",
        fields: 'files(id, name, parents, createdTime)'
    });
    results.toi_global = toiRes.data.files;

    // 3. Search for "BR" or "CR" files globally
    console.log("Searching for BR/CR files globally...");
    const brRes = await drive.files.list({
        q: "(name contains 'BR' or name contains 'CR') and trashed = false",
        fields: 'files(id, name, parents, createdTime)'
    });
    results.br_cr_global = brRes.data.files;

    fs.writeFileSync('drive_investigation_results.json', JSON.stringify(results, null, 2));
    console.log("Results written to drive_investigation_results.json");
}

main().catch(console.error);
