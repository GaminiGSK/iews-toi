const { google } = require('googleapis');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const TaxTemplate = require('../models/TaxTemplate');

const folderId = "1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO"; // Financial Statement preperation folder

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function sync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        // RESET: Clear existing templates to avoid duplicates and ensure a clean 1-27 sequence
        console.log("🧹 Clearing old templates...");
        await TaxTemplate.deleteMany({});

        console.log(`📡 Listing files in Drive folder: ${folderId}...`);

        let allFiles = [];
        let pageToken = null;
        do {
            const res = await drive.files.list({
                q: `'${folderId}' in parents and name contains '513aad76' and trashed = false`,
                fields: 'nextPageToken, files(id, name, mimeType, size)',
                pageSize: 1000,
                pageToken: pageToken,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });
            allFiles = allFiles.concat(res.data.files);
            pageToken = res.data.nextPageToken;
        } while (pageToken);

        // Sort by name (513aad76-001, 002, ...)
        allFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        // Take only the first 27 if more exist (though we expect exactly 27 for TOI)
        const files = allFiles.filter(f => f.mimeType.startsWith('image/')).slice(0, 27);

        console.log(`📂 Found ${files.length} total image files. Starting sync...`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const pageNum = i + 1;

            console.log(`📥 Downloading Page ${pageNum}: ${file.name} (${file.id})...`);
            const driveRes = await drive.files.get(
                { fileId: file.id, alt: 'media', supportsAllDrives: true },
                { responseType: 'arraybuffer' }
            );

            const base64Data = Buffer.from(driveRes.data).toString('base64');

            const template = new TaxTemplate({
                name: `Page ${pageNum}`,
                groupName: 'TOI-2024',
                pageNumber: pageNum,
                originalName: file.name,
                filename: `toi_page_${pageNum}_${Date.now()}.jpg`,
                path: `toi_page_${pageNum}_${Date.now()}.jpg`,
                type: file.mimeType,
                size: file.size,
                data: base64Data,
                status: 'Restored',
                mappings: [] // Initialize with empty mappings
            });

            await template.save();
            console.log(`✅ Synced: Page ${pageNum} (${file.name})`);
        }

        console.log(`🏁 Sync complete! 27 Pages added to TaxTemplate.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Sync Error:", err);
        process.exit(1);
    }
}

sync();
