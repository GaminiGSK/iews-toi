require('dotenv').config();
const mongoose = require('mongoose');
const BankFile = require('./models/BankFile');
const Transaction = require('./models/Transaction');
const googleDrive = require('./services/googleDrive');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log("Connected to DB. Wiping ANGKOR bank data (DB + Drive)...");
    
    // 1. Find all BankFiles for ANGKOR to get driveIds
    const files = await BankFile.find({ companyCode: 'ANGKOR' });
    console.log(`Found ${files.length} BankFiles to clean up.`);

    // 2. Remove files from Google Drive (moves them to "Deleted" folder usually via googleDrive.js)
    let driveCount = 0;
    for (let file of files) {
        if (file.driveId) {
            try {
                // Actually deleting them per googleDrive's deleteFile logic
                await googleDrive.deleteFile(file.driveId);
                driveCount++;
                console.log(`Moved Drive File to Deleted Folder: ${file.driveId}`);
            } catch (err) {
                console.error(`Failed to delete drive file ${file.driveId}:`, err.message);
            }
        }
    }
    console.log(`Soft-deleted ${driveCount} files from Google Drive.`);

    // 3. Delete from Database
    const bankRes = await BankFile.deleteMany({ companyCode: 'ANGKOR' });
    console.log(`Deleted ${bankRes.deletedCount} BankFile records for ANGKOR from Database.`);

    const txRes = await Transaction.deleteMany({ companyCode: 'ANGKOR' });
    console.log(`Deleted ${txRes.deletedCount} Transaction records for ANGKOR from Database.`);

    console.log("✅ Cleanup complete. The user can now start fresh and drop statements again.");
    process.exit(0);
}).catch(err => {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
});
