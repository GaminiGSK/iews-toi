const mongoose = require('mongoose');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const { extractFromBuffer } = require('../services/googleAI');

async function repair() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) {
            console.error("GKSMART user not found.");
            process.exit(1);
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../config/service-account.json'),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        const folderId = user.brFolderId || '1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS';

        console.log(`Checking files in ${folderId}...`);
        const listRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
        });

        const files = listRes.data.files || [];
        console.log(`Found ${files.length} files to process.`);

        let profile = await CompanyProfile.findOne({ user: user._id });
        if (!profile) {
            profile = new CompanyProfile({ user: user._id, companyCode: user.companyCode });
        }

        for (const file of files) {
            console.log(`--- Processing: ${file.name} ---`);

            const response = await drive.files.get(
                { fileId: file.id, alt: 'media' },
                { responseType: 'stream' }
            );

            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                response.data.on('data', chunk => chunks.push(chunk));
                response.data.on('error', reject);
                response.data.on('end', () => resolve(Buffer.concat(chunks)));
            });

            console.log(`Downloaded ${file.name}, size: ${Math.round(buffer.length / 1024)} KB`);

            console.log(`Extracting text via Gemini...`);
            const rawText = await extractFromBuffer(buffer, file.mimeType);

            let existingDoc = profile.documents.find(d => d.originalName === file.name);
            if (!existingDoc) {
                profile.documents.push({
                    docType: 'br_extraction',
                    originalName: file.name,
                    path: `drive:${file.id}`,
                    status: 'Verified',
                    rawText: rawText,
                    uploadedAt: new Date()
                });
                console.log(`✅ Added to DB.`);
            } else {
                existingDoc.rawText = rawText;
                existingDoc.status = 'Verified';
                console.log(`✅ Updated existing. Length: ${rawText.length}`);
            }
        }

        await profile.save();
        console.log("Repair finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Repair Error:", err.message);
        process.exit(1);
    }
}
repair();
