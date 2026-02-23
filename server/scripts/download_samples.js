require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function downloadFile(fileId, destPath) {
    const dest = fs.createWriteStream(destPath);
    const res = await drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
    );
    return new Promise((resolve, reject) => {
        res.data
            .on('end', () => {
                console.log(`✅ Downloaded ${destPath}`);
                resolve();
            })
            .on('error', (err) => {
                console.error('Download Error:', err);
                reject(err);
            })
            .pipe(dest);
    });
}

async function main() {
    const files = [
        { id: '1zaD3MZyk-jxPxNoWWDnmvUOtJFF23Ez8', name: 'page1.jpg' },
        { id: '1svAbGJ5V25wDfxGx4XxtFhl4XgiLpeqY', name: 'page10.jpg' },
        { id: '1kd9rEgJb-PiBBi2rQKkB5ANG9lOgTviD', name: 'page15.jpg' }
    ];

    const tempDir = path.join(__dirname, '../temp_forms');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    for (const file of files) {
        await downloadFile(file.id, path.join(tempDir, file.name));
    }
}

main();
