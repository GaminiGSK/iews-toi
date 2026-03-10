require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const BankStatement = require('./models/BankStatement');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const stmts = await BankStatement.find().sort({ createdAt: -1 });

        let report = `Total Statements in entire DB: ${stmts.length}\n\n`;
        stmts.forEach((s, i) => {
            report += `[${i+1}] ID: ${s._id} | OName: ${s.originalName} | Bank: ${s.bankName} | CC: ${s.companyCode} | Txs: ${s.transactions?.length || 0} | Date: ${s.createdAt}\n`;
        });
        fs.writeFileSync('report_all.txt', report, 'utf8');
        console.log("Report generated at report_all.txt");
    } catch(e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
