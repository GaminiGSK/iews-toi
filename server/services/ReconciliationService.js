const cron = require('node-cron');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const Transaction = require('../models/Transaction');
const BankFile = require('../models/BankFile');

// Setup Google Drive Auth
let driveInstance = null;
function getDrive() {
    if (driveInstance) return driveInstance;

    // We expect this service to run in the main server loop, so dotenv is already loaded
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyPath) {
        console.warn("[ReconciliationService] Missing GOOGLE_APPLICATION_CREDENTIALS!");
        return null;
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, '../../', keyPath),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    driveInstance = google.drive({ version: 'v3', auth });
    return driveInstance;
}

/**
 * Stage 1: Analyze active BankFiles and remove exact Drive duplicates (soft-delete or decouple).
 */
async function cleanupBankFileDuplicates() {
    console.log("[ReconciliationService] Stage 1/2: Checking for Duplicate Bank Files...");
    try {
        const bankFiles = await BankFile.find({});
        const seenHashes = new Set();
        let deletedFiles = 0;

        const drive = getDrive();

        // Loop files chronologically (to keep the first uploaded version)
        for (const file of bankFiles.sort((a, b) => a.createdAt - b.createdAt)) {
            // Precise fingerprint combining filename and the extracted date range.
            const fingerprint = `${file.originalName}_${file.dateRange}`;

            if (seenHashes.has(fingerprint)) {
                console.log(`[ReconciliationService] Deleting duplicate BankFile record: ${file.originalName}`);
                // Delete from DB
                await BankFile.findByIdAndDelete(file._id);

                // Try to delete physical asset from Drive if ID is still valid
                if (file.driveId && drive) {
                    try {
                        await drive.files.delete({ fileId: file.driveId });
                        console.log(`[ReconciliationService]  -> Deleted from Drive: ${file.driveId}`);
                    } catch (err) {
                        // File might already be gone
                        console.log(`[ReconciliationService]  -> Could not delete from Drive: ${err.message}`);
                    }
                }
                deletedFiles++;
            } else {
                seenHashes.add(fingerprint);
            }
        }

        console.log(`[ReconciliationService] Stage 1 Complete. Purged ${deletedFiles} duplicate bank files.`);
    } catch (e) {
        console.error("[ReconciliationService] Stage 1 Error:", e.message);
    }
}

/**
 * Stage 2: Database deep-clean for duplicate transactions.
 * If AI oversteps and re-reads the same data twice into the Ledger, this catches it.
 */
async function cleanupDuplicateTransactions() {
    console.log("[ReconciliationService] Stage 2/2: Checking for Duplicate Ledger Transactions...");
    try {
        // Fetch all, keep the oldest ones based on creation time
        const transactions = await Transaction.find({}).sort({ date: 1, createdAt: 1 });
        let deletedRecords = 0;
        const seenFp = new Set();

        for (const txn of transactions) {
            const dateStr = txn.date ? new Date(txn.date).toISOString().split('T')[0] : 'nodate';
            const amount = txn.amount ? txn.amount.toFixed(2) : '0.00';
            let balance = txn.balance ? txn.balance.toFixed(2) : '0.00';

            // In case it's in originalData instead
            if (balance === '0.00' && txn.originalData && txn.originalData.balance) {
                balance = String(txn.originalData.balance).replace(/,/g, '');
            }

            const desc = (txn.description || '').trim();
            const userId = txn.user ? txn.user.toString() : 'nouser';
            const companyCode = txn.companyCode || 'nocode';

            // Creating a strict fingerprint
            const fingerprint = `${userId}_${companyCode}_${dateStr}_${amount}_${balance}_${desc}`;

            if (seenFp.has(fingerprint)) {
                console.log(`[ReconciliationService] Removing exact duplicate transaction: [${dateStr}] $${amount}`);
                await Transaction.findByIdAndDelete(txn._id);
                deletedRecords++;
            } else {
                seenFp.add(fingerprint);
            }
        }
        console.log(`[ReconciliationService] Stage 2 Complete. Purged ${deletedRecords} exact duplicate ledger records.`);
    } catch (e) {
        console.error("[ReconciliationService] Stage 2 Error:", e.message);
    }
}

// -------------------------------------------------------------
// Initialize Cron Jobs
// -------------------------------------------------------------
function startCronJobs() {
    console.log("[ReconciliationService] System Guardian cron jobs initialized.");

    // Run this process at Minute 0 of every hour ("0 * * * *")
    cron.schedule('0 * * * *', async () => {
        console.log("\n========================================================");
        console.log(`[ReconciliationService] Triggered Hourly Systematic Sweep (Time: ${new Date().toISOString()})`);
        console.log("========================================================");

        await cleanupBankFileDuplicates();
        await cleanupDuplicateTransactions();

        console.log("[ReconciliationService] Systematic Sweep passed successfully.\n");
    });
}

// Ensure an immediate run is exported for manual triggers if needed
module.exports = {
    startCronJobs,
    cleanupBankFileDuplicates,
    cleanupDuplicateTransactions
};
