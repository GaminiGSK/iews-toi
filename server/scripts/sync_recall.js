const { google } = require('googleapis');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const googleAI = require('../services/googleAI');
const fs = require('fs');

async function syncAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ driveFolderId: { $exists: true } });
        console.log(`Starting Recall Scan for ${users.length} users...`);

        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../config/service-account.json'),
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });
        const drive = google.drive({ version: 'v3', auth });

        for (const user of users) {
            console.log(`\nScanning for ${user.username}...`);
            let profile = await CompanyProfile.findOne({ user: user._id });
            if (!profile) continue;

            const res = await drive.files.list({
                q: "trashed = false", // Broad search to find anything matching the names in DB
                fields: 'files(id, name, size, mimeType)',
                pageSize: 1000
            });
            const allFiles = res.data.files || [];
            console.log(`Auditing ${allFiles.length} files in Drive for matching names...`);

            let changed = false;
            for (const d of profile.documents) {
                if (d.rawText && d.rawText.includes("failed")) {
                    console.log(`Repairing doc: ${d.originalName}`);
                    // Filter allFiles for non-zero version of this name
                    const realFile = allFiles.find(f => f.name === d.originalName && parseInt(f.size) > 0);

                    if (realFile) {
                        console.log(`Found real file! ID: ${realFile.id} (Size: ${realFile.size})`);

                        const tempPath = `./tmp/recall_${Date.now()}.jpg`;
                        if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

                        const dest = fs.createWriteStream(tempPath);
                        const driveStream = await drive.files.get({ fileId: realFile.id, alt: 'media' }, { responseType: 'stream' });
                        await new Promise((resolve, reject) => {
                            driveStream.data.pipe(dest).on('finish', resolve).on('error', reject);
                        });

                        console.log(`Calling AI on recalled content...`);
                        try {
                            const newText = await googleAI.extractRawText(tempPath);
                            d.rawText = newText;
                            d.status = 'Verified';
                            changed = true;
                            console.log(`SUCCESS! Recalled: ${d.originalName}`);
                        } catch (aiErr) {
                            console.error(`AI Recall Failed:`, aiErr.message);
                        }
                        fs.unlinkSync(tempPath);
                    } else {
                        console.log(`Could not find any non-zero version of ${d.originalName} in the Drive.`);
                    }
                }
            }
            if (changed) {
                await profile.save();
                console.log(`Profile updated for ${user.username}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
syncAll();
