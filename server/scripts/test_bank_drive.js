const { google } = require('googleapis');
require('dotenv').config({ path: '../.env' });
const path = require('path');

async function testAccess() {
    try {
        const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const auth = new google.auth.GoogleAuth({
            keyFile: path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, '../', keyPath),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const folderId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';
        console.log(`Checking folder: ${folderId}`);

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
        });

        console.log('--- FOLDER CONTENTS ---');
        console.log(`Items found: ${res.data.files.length}`);
        res.data.files.forEach(f => {
            console.log(`- ${f.name} (${f.id}) [${f.mimeType}]`);
        });

        // Test Upload
        console.log('\nTesting small upload...');
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from('hello world'));

        const uploadRes = await drive.files.create({
            requestBody: {
                name: 'TEST_PERMISSIONS.txt',
                parents: [folderId]
            },
            media: {
                mimeType: 'text/plain',
                body: bufferStream
            }
        });
        console.log('✅ Upload Success! ID:', uploadRes.data.id);

        // Cleanup
        await drive.files.delete({ fileId: uploadRes.data.id });
        console.log('✅ Cleanup Success!');

    } catch (err) {
        console.error('❌ ACCESS ERROR:', err.message);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
}

testAccess();
