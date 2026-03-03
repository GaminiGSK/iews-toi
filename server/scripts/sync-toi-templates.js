const { google } = require('googleapis');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const TaxTemplate = require('../models/TaxTemplate');

const folderId = "1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW";

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function sync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        console.log(`📡 Listing files in Drive folder: ${folderId}...`);
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, size)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const files = res.data.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        console.log(`📂 Found ${files.length} files. Starting sync...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check if already synced
            const existing = await TaxTemplate.findOne({ originalName: file.name });
            if (existing) {
                console.log(`⏩ Skipping ${file.name} (Already synced)`);
                continue;
            }

            console.log(`📥 Downloading ${file.name} (${file.id})...`);
            const driveRes = await drive.files.get(
                { fileId: file.id, alt: 'media', supportsAllDrives: true },
                { responseType: 'arraybuffer' }
            );

            const base64Data = Buffer.from(driveRes.data).toString('base64');

            const template = new TaxTemplate({
                name: file.name,
                groupName: 'TOI-01',
                pageNumber: i + 1, // Order by name
                originalName: file.name,
                filename: `toi_page_${i + 1}_${Date.now()}.jpg`,
                path: `toi_page_${i + 1}_${Date.now()}.jpg`, // Dummy path, as we use 'data' for Serving
                type: file.mimeType,
                size: file.size,
                data: base64Data,
                status: 'Restored'
            });

            await template.save();
            console.log(`✅ Synced to DB: ${file.name} -> Page ${i + 1}`);
        }

        console.log("🏁 Sync complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Sync Error:", err);
        process.exit(1);
    }
}

sync();
