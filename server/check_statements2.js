require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const BankStatement = require('./models/BankStatement');
const User = require('./models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ username: 'GKSMART' });
        const companyCode = users[0].companyCode;
        const stmts = await BankStatement.find({ companyCode: companyCode }).sort({ createdAt: -1 });

        let report = `Total Statements in DB: ${stmts.length}\n\n`;
        stmts.forEach((s, i) => {
            report += `[${i+1}] ${s.originalName} | ${s.bankName} | Txs: ${s.transactions?.length || 0} | Date: ${s.createdAt}\n`;
        });
        fs.writeFileSync('report.txt', report, 'utf8');
        console.log("Report generated at report.txt");
    } catch(e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
