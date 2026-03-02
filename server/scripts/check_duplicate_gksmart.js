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
        const rootId = '1wJbkdDYD8exNw8uarUlOxGQipfGQxuux'; // The OTHER GKSMART folder
        console.log(`Deep Dive: Searching OLD GKSMART (ID: ${rootId})...`);

        // Find BR subfolder in this root
        const brRes = await drive.files.list({
            q: `'${rootId}' in parents and name = 'BR' and trashed = false`,
            fields: 'files(id, name)',
        });

        if (brRes.data.files && brRes.data.files.length > 0) {
            const brId = brRes.data.files[0].id;
            console.log(`Found BR subfolder: ${brId}`);

            const filesRes = await drive.files.list({
                q: `'${brId}' in parents and trashed = false`,
                fields: 'files(id, name, size, createdTime)',
            });
            const files = filesRes.data.files || [];
            console.log(`Found ${files.length} files in this BR folder.`);
            files.forEach(f => {
                console.log(`- ${f.name} [ID: ${f.id}] [Size: ${f.size}] [Created: ${f.createdTime}]`);
            });
        } else {
            console.log("No BR subfolder found in this root.");
        }

    } catch (err) {
        console.error(err);
    }
}
search();
