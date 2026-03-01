const mongoose = require('mongoose');
const BankFile = require('../models/BankFile');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, '../config/service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

async function totalFreshStart() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB. Starting TOTAL FRESH START...");

        const companyCodes = ["GK_SMART_AI", "TEXLINK"];

        // 1. DELETE ALL TRANSACTIONS
        const txRes = await Transaction.deleteMany({ companyCode: { $in: companyCodes } });
        console.log(`✅ Deleted ${txRes.deletedCount} transactions.`);

        // 2. DELETE ALL BANK FILE RECORDS
        const fileRes = await BankFile.deleteMany({ companyCode: { $in: companyCodes } });
        console.log(`✅ Deleted ${fileRes.deletedCount} bank file registry entries.`);

        // 3. CLEAN GOOGLE DRIVE FOLDERS
        const users = await User.find({ username: { $in: ["GKSMART", "TEXLINK"] } });

        for (const user of users) {
            if (user.bankStatementsFolderId) {
                console.log(`Cleaning Drive Folder for ${user.username}: ${user.bankStatementsFolderId}...`);
                const res = await drive.files.list({
                    q: `'${user.bankStatementsFolderId}' in parents and trashed = false`,
                    fields: 'files(id, name)',
                });

                for (const file of res.data.files) {
                    console.log(`- Deleting: ${file.name} (${file.id})`);
                    // Permanent delete for this fresh start
                    await drive.files.delete({ fileId: file.id });
                }
                console.log(`✅ ${user.username} folder is now empty.`);
            }
        }

        console.log("\n--- CONGRATULATIONS: FRESH START READY ---");
        console.log("Database: CLEARED");
        console.log("Google Drive: CLEARED");
        console.log("You can now upload your bank statements into a 100% clean system.");

        process.exit(0);
    } catch (err) {
        console.error("❌ Cleanup Error:", err.message);
        process.exit(1);
    }
}

totalFreshStart();
