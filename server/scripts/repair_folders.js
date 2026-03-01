const mongoose = require('mongoose');
const User = require('../models/User');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function repairFolders() {
    const freshBR = "1Z56h5vAURMvM0Dad9zmcLjO8zeM5AoJf";
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ driveFolderId: { $exists: true } });
        console.log(`Checking ${users.length} user folders...`);

        for (const user of users) {
            console.log(`Validating ${user.username} (ID: ${user.driveFolderId})...`);
            try {
                const res = await drive.files.get({
                    fileId: user.driveFolderId,
                    fields: 'id, name, parents, trashed'
                });
                console.log(`- EXIST: ${res.data.name} | Trashed: ${res.data.trashed}`);

                if (!res.data.parents || !res.data.parents.includes(freshBR)) {
                    console.log(`- RE-PARENTING to ${freshBR}...`);
                    const prev = res.data.parents ? res.data.parents.join(',') : '';
                    await drive.files.update({
                        fileId: user.driveFolderId,
                        addParents: freshBR,
                        removeParents: prev,
                        fields: 'id, parents',
                        supportsAllDrives: true
                    });
                    console.log(`✅ Fixed!`);
                }
            } catch (err) {
                if (err.code === 404) {
                    console.warn(`❌ DELETED OR LOST: ${user.username} folder. Clearing ID from DB.`);
                    user.driveFolderId = null;
                    await user.save();
                } else {
                    console.error(`Error checking ${user.username}: ${err.message}`);
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repairFolders();
