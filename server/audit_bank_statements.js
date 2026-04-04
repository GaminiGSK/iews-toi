const mongoose = require('mongoose');
require('dotenv').config();
const BankStatement = require('./models/BankStatement');

async function runAudit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB. Starting Bank Statement Audit...");

        const allStatements = await BankStatement.find({});
        console.log(`Found ${allStatements.length} Bank Statement documents across all units.\n`);

        let errorCount = 0;
        let massiveAmountCount = 0;
        let emptyStatementsCount = 0;

        for (const stmt of allStatements) {
            const company = stmt.companyCode;
            const originalName = stmt.originalName || "Unknown File";
            
            if (!stmt.transactions || stmt.transactions.length === 0) {
                 console.log(`[WARNING] Empty statement: ${company} - ${originalName}`);
                 emptyStatementsCount++;
                 continue;
            }

            for (const tx of stmt.transactions) {
                // Check for API errors
                if (tx.date === 'DEBUG_ERR' || tx.date === 'FATAL_ERR') {
                    console.log(`[ERROR DETECTED] AI Extraction Failed for ${company} in file '${originalName}'`);
                    console.log(`  -> Reason: ${tx.description}`);
                    errorCount++;
                }

                // Check for suspiciously large amounts (potential KHR not converted)
                // If moneyIn or moneyOut is > 50,000 USD, we flag it just to be safe.
                const inAmt = parseFloat(tx.moneyIn) || 0;
                const outAmt = parseFloat(tx.moneyOut) || 0;
                if (inAmt > 50000 || outAmt > 50000) {
                     console.log(`[MASSIVE AMOUNT] Suspiciously large value for ${company} in file '${originalName}'`);
                     console.log(`  -> Date: ${tx.date} | Desc: ${tx.description.substring(0, 50)}...`);
                     console.log(`  -> In: $${inAmt} | Out: $${outAmt}`);
                     massiveAmountCount++;
                }
            }
        }

        console.log("\n--- AUDIT SUMMARY ---");
        console.log(`Statements Scanned: ${allStatements.length}`);
        console.log(`Empty Statements: ${emptyStatementsCount}`);
        console.log(`AI Parsing Errors (DEBUG_ERR/FATAL_ERR): ${errorCount}`);
        console.log(`Suspiciously Large Values (> $50,000): ${massiveAmountCount}`);
        
        process.exit(0);

    } catch (err) {
        console.error("Audit failed:", err);
        process.exit(1);
    }
}

runAudit();
