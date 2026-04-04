const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');

async function checkAngkor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const angkorStatements = await BankStatement.find({ companyCode: 'ANGKOR' }).lean();

        let outputStr = "";
        if (angkorStatements.length === 0) {
            outputStr += "No bank statements found for unit ANGKOR.\n";
        } else {
            outputStr += `Found ${angkorStatements.length} Bank Statement(s) for ANGKOR.\n\n`;
            
            angkorStatements.forEach((stmt, idx) => {
                outputStr += `=== Statement ${idx + 1} | File: ${stmt.originalName} ===\n`;
                outputStr += `Uploaded At: ${stmt.uploadedAt}\n`;
                outputStr += `Transaction Count: ${stmt.transactions ? stmt.transactions.length : 0}\n`;
                
                if (stmt.transactions && stmt.transactions.length > 0) {
                    stmt.transactions.forEach((tx, tIdx) => {
                        let amountLog = `IN: ${tx.moneyIn || 0} | OUT: ${tx.moneyOut || 0}`;
                        outputStr += `  [${tIdx + 1}] Date: ${tx.date} | ${amountLog} | Bal: ${tx.balance}\n`;
                        outputStr += `      Desc: ${tx.description}\n`;
                    });
                }
                outputStr += "\n";
            });
        }
        
        fs.writeFileSync('angkor_pure.txt', outputStr);
        console.log("Wrote fully to angkor_pure.txt");
        process.exit(0);
    } catch (err) {
        console.error("Error writing angkor statement:", err);
        process.exit(1);
    }
}

checkAngkor();
