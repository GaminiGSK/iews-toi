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

    // TOI FOAM Folder
    const toiFoamId = "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW";

    console.log(`Checking trash for files that were in TOI FOAM (${toiFoamId})...`);
    const trashRes = await drive.files.list({
        // Note: 'parents' collection reflects ONLY current parents. Trashed files might have lost their parent?
        // Actually, we can search by q: "trashed = true" but we might not know their original parent easily.
        // However, we can search for the documents we know were there.
        q: "trashed = true",
        fields: 'files(id, name, parents, trashedTime)'
    });

    // Search for 513aad76 files in trash
    const toiInTrash = trashRes.data.files.filter(f => f.name.includes("513aad76"));
    console.log("TOI files in trash:", JSON.stringify(toiInTrash, null, 2));

    // Search for BR files in trash
    const brInTrash = trashRes.data.files.filter(f => f.name.includes("MOC") || f.name.includes("Patent") || f.name.includes("Extract"));
    console.log("BR/CR files in trash:", JSON.stringify(brInTrash, null, 2));
}

main().catch(console.error);
