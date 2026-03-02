const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

async function deduplicate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- DB CONNECTED ---');

        const user = await User.findOne({ username: 'GKSMART' });
        if (!user) {
            console.log('User GKSMART not found');
            process.exit(0);
        }

        const profile = await CompanyProfile.findOne({ user: user._id });
        if (!profile) {
            console.log('Profile for GKSMART not found');
            process.exit(0);
        }

        console.log(`Initial Document Count: ${profile.documents.length}`);

        // --- GOOGLE DRIVE AUTH ---
        const authClient = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../config/service-account.json'),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth: authClient });

        const seenNames = new Set();
        const uniqueDocs = [];
        const duplicatesToDelete = [];

        for (const doc of profile.documents) {
            if (seenNames.has(doc.originalName)) {
                duplicatesToDelete.push(doc);
                console.log(`Duplicate found: ${doc.originalName}`);
            } else {
                seenNames.add(doc.originalName);
                uniqueDocs.push(doc);
            }
        }

        console.log(`Unique Count: ${uniqueDocs.length}`);
        console.log(`To delete: ${duplicatesToDelete.length}`);

        // 1. Delete from Google Drive
        for (const doc of duplicatesToDelete) {
            if (doc.path && doc.path.startsWith('drive:')) {
                const fileId = doc.path.split(':')[1];
                console.log(`Deleting from Drive: ${doc.originalName} (${fileId})`);
                try {
                    await drive.files.delete({ fileId: fileId });
                    console.log('  [Drive] Deleted.');
                } catch (e) {
                    console.log(`  [Drive] Delete failed for ${fileId}: ${e.message}`);
                }
            } else {
                console.log(`Skipping Drive delete for ${doc.originalName} (No ID)`);
            }
        }

        // 2. Update DB
        profile.documents = uniqueDocs;
        await profile.save();
        console.log('--- DATABASE UPDATED ---');

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

deduplicate();
