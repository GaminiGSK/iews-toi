const { google } = require('googleapis');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI);
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../config/service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // ROOT FOLDER
    const rootId = "1e6yf51GTTjRUeWO7RPeg5jRiu3i_eE3H";

    try {
        console.log("Creating new GKSMART_SYNKED folder...");
        const res = await drive.files.create({
            requestBody: {
                name: "GKSMART_SYNKED",
                mimeType: "application/vnd.google-apps.folder",
                parents: [rootId]
            },
            fields: 'id'
        });
        const folderId = res.data.id;
        console.log("New Folder ID:", folderId);

        const user = await User.findOne({ companyCode: 'GK_SMART_AI' });
        if (user) {
            user.bankStatementsFolderId = folderId;
            await user.save();
            console.log("Updated GKSMART user with new folder ID.");
        } else {
            console.error("USER NOT FOUND");
        }
    } catch (err) {
        console.error("SETUP ERROR:", err.message);
    }
    process.exit(0);
}

setup();
