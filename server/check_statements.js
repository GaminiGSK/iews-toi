require('dotenv').config();
const mongoose = require('mongoose');

// Assuming models are available in the directory
const BankStatement = require('./models/BankStatement');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User');

async function runReport() {
    try {
        console.log("Connecting to Database:", process.env.MONGODB_URI ? "Found String" : "MISSING String!");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected...");

        const users = await User.find({ username: 'GKSMART' });
        console.log("\n--- USER FOUND ---");
        if (users.length > 0) {
            console.log(`User ID: ${users[0]._id}, CompanyCode: ${users[0].companyCode}`);
            console.log(`Bank Statements Folder ID: ${users[0].bankStatementsFolderId || 'NULL'}`);
            console.log(`Drive Folder ID: ${users[0].driveFolderId || 'NULL'}`);
            
            const companyCode = users[0].companyCode;
            
            const stmts = await BankStatement.find({ companyCode: companyCode }).sort({ createdAt: -1 });
            console.log(`\n--- BANK STATEMENTS IN DB (${stmts.length} total) ---`);
            
            let totalTxs = 0;
            stmts.forEach((s, idx) => {
                const txCount = s.transactions ? s.transactions.length : 0;
                totalTxs += txCount;
                console.log(`[${idx+1}] File: ${s.originalName}`);
                console.log(`    Bank: ${s.bankName} | ACC: ${s.accountNumber} | TX Count: ${txCount}`);
                console.log(`    Drive Folder ID: ${s.driveFolderId}`);
                if (txCount > 0) {
                    // Show just the first tx as a sample
                    const firstTx = s.transactions[0];
                    console.log(`    Sample TX: Date: ${firstTx.date}, Desc: ${firstTx.description?.substring(0,30)}, MoneyIn: ${firstTx.moneyIn}, MoneyOut: ${firstTx.moneyOut}, Balance: ${firstTx.balance}`);
                }
            });
            console.log(`\nTOTAL Transactions across all statements: ${totalTxs}`);

            const profile = await CompanyProfile.findOne({ user: users[0]._id });
            console.log("\n--- COMPANY PROFILE IN DB ---");
            if (profile) {
                console.log(`Docs in Pool: ${profile.documents ? profile.documents.length : 0}`);
            } else {
                console.log("No Company Profile found.");
            }
            
        } else {
            console.log("User GKSMART not found.");
        }

    } catch (e) {
        console.error("Scripte execution error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runReport();
