const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function listRecursive(folderId, depth = 0) {
    try {
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size, owners)',
        });
        const files = res.data.files || [];
        for (const f of files) {
            const owner = f.owners && f.owners[0] ? f.owners[0].emailAddress : 'UNKNOWN';
            const isMe = f.owners && f.owners[0] ? f.owners[0].me : false;
            console.log(`${"  ".repeat(depth)}- ${f.name} [ID: ${f.id}] [Size: ${f.size || '0'}] [Owner: ${owner}] [SA: ${isMe}]`);
            if (f.mimeType === 'application/vnd.google-apps.folder') {
                await listRecursive(f.id, depth + 1);
            }
        }
    } catch (err) {
        console.error(err);
    }
}
async function main() {
    console.log("RECURSIVE LIST OF BLUE AGENT 2 [1b_ajdruz4LWiY8owfo-H-aWFqVtogTZo]");
    await listRecursive('1b_ajdruz4LWiY8owfo-H-aWFqVtogTZo');
}
main();
