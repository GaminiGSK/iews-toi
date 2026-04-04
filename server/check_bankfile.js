const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const BankFile = require('./models/BankFile');
const Transaction = require('./models/Transaction');

async function checkBankFiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const files = await BankFile.find({ companyCode: 'ANGKOR' }).lean();

        let outputStr = `Found ${files.length} BankFile(s) for ANGKOR.\n\n`;
        for (const file of files) {
            outputStr += `=== File: ${file.originalName} | DateRange: ${file.dateRange} ===\n`;
            
            // fetch transactions for this file
            if (file.driveId) {
                const txs = await Transaction.find({ 'originalData.driveId': file.driveId, companyCode: 'ANGKOR' }).lean();
                outputStr += `Status: ${file.status} | Locked: ${file.isLocked} | Txs: ${txs.length}\n`;
                if(txs.length === 0) outputStr += `-> EMPTY TRANSACTIONS (DriveID: ${file.driveId})\n`;
            } else {
                outputStr += `-> NO DRIVE ID\n`;
            }
            outputStr += "\n";
        }
        
        fs.writeFileSync('angkor_bankfile.txt', outputStr);
        console.log("Wrote fully to angkor_bankfile.txt");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBankFiles();
