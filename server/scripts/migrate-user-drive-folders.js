const mongoose = require('mongoose');
const User = require('../models/User');
const { createFolder, findFolder } = require('../services/googleDrive');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function migrateUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Use the root folder defined in .env (e.g. Blue Agent 2)
        const driveRoot = process.env.GOOGLE_DRIVE_FOLDER_ID;
        console.log(`[Migration] Scanning users for Drive Workspace integration...`);

        const users = await User.find({ role: 'user' });
        const masterUsers = await User.find({ username: 'GKSMART' });

        // Manual deduplication by ID
        const userMap = new Map();
        [...users, ...masterUsers].forEach(u => userMap.set(u._id.toString(), u));
        const allUsers = Array.from(userMap.values());

        console.log(`Found ${allUsers.length} users: ${allUsers.map(u => u.username).join(', ')}`);

        for (const user of allUsers) {
            console.log(`[Migration] Validating ${user.username}...`);
            try {
                // 1. Ensure User Root Folder exists
                let folder = await findFolder(user.username, driveRoot);
                if (!folder) {
                    folder = await createFolder(user.username, driveRoot);
                }
                user.driveFolderId = folder.id;

                // 2. Ensure bank statements folder exists
                let bankSub = await findFolder('bank statements', user.driveFolderId);
                if (!bankSub) bankSub = await createFolder('bank statements', user.driveFolderId);
                user.bankStatementsFolderId = bankSub.id;

                // 3. Ensure BR folder exists
                let brSub = await findFolder('BR', user.driveFolderId);
                if (!brSub) brSub = await createFolder('BR', user.driveFolderId);
                user.brFolderId = brSub.id;

                await user.save();
                console.log(`✅ ${user.username} synced.`);
            } catch (e) {
                console.error(`❌ Failed ${user.username}: ${e.message}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrateUsers();
