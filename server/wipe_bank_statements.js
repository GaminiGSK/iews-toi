require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');
const BankStatement = require('./models/BankStatement');
const User = require('./models/User');

const authClient = new google.auth.GoogleAuth({
    keyFile: './config/service-account.json',
    scopes: ['https://www.googleapis.com/auth/drive']
});

async function wipe() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const users = await User.find({ username: 'GKSMART' });
        if (users.length === 0) throw new Error("GKSMART user not found.");
        const user = users[0];

        // 1. Delete MongoDB Records
        console.log(`Wiping MongoDB records for company: ${user.companyCode}...`);
        const delResult = await BankStatement.deleteMany({ companyCode: user.companyCode });
        console.log(`Deleted ${delResult.deletedCount} BankStatement records from DB.`);

        // 2. Delete main Google Drive Folder if it exists
        if (user.bankStatementsFolderId) {
            console.log(`Deleting Drive Folder ID: ${user.bankStatementsFolderId}...`);
            const drive = google.drive({ version: 'v3', auth: authClient });
            try {
                await drive.files.delete({ fileId: user.bankStatementsFolderId });
                console.log("Drive folder successfully deleted.");
            } catch(driveErr) {
                console.log("Drive folder already deleted or inaccessible:", driveErr.message);
            }

            // Unlink folder from user profile
            user.bankStatementsFolderId = null;
            await user.save();
            console.log("Unlinked folder from User profile.");
        } else {
             console.log("No bankStatementsFolderId attached to user profile.");
        }

        console.log("WIPE COMPLETE. System is ready for a fresh drop.");
    } catch(e) {
        console.error("Wipe failed:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

wipe();
