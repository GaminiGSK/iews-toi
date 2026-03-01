const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function uploadTiny() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    const targetFolderId = '1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH';

    // Tiny black pixel JPEG Base64
    const tinyJpeg = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALF//9k=', 'base64');
    const tempPath = path.join(__dirname, '../uploads/TINY.jpg');
    fs.writeFileSync(tempPath, tinyJpeg);

    try {
        console.log("Uploading tiny JPG...");
        const res = await drive.files.create({
            requestBody: {
                name: "TINY_PIXEL.jpg",
                parents: [targetFolderId]
            },
            media: {
                mimeType: 'image/jpeg',
                body: fs.createReadStream(tempPath)
            },
            fields: 'id'
        });
        console.log("SUCCESS! ID:", res.data.id);
    } catch (err) {
        console.error("UPLOAD ERROR:", err.message);
    }
    fs.unlinkSync(tempPath);
    process.exit(0);
}

uploadTiny();
