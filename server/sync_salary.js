require('dotenv').config();
const mongoose = require('mongoose');

async function syncSalaryToGL() {
    await mongoose.connect(process.env.MONGODB_URI);
    const SalaryModule = require('./models/SalaryModule');
    const JournalEntry = require('./models/JournalEntry');
    const AccountCode = require('./models/AccountCode');
    const User = require('./models/User');
    
    const companyCode = 'GK_SMART_AI';
    const gamini = await User.findOne({ companyCode });
    
    const salary = await SalaryModule.findOne({ companyCode });
    if (!salary) {
        console.log("No salary module.");
        process.exit();
    }
    
    let tSal = 0;
    if (salary.shareholderEmployees) {
        salary.shareholderEmployees.forEach(e => tSal += parseFloat(e.annualSalary || 0));
    }
    if (salary.nonShareholderEmployees) {
        salary.nonShareholderEmployees.forEach(e => tSal += parseFloat(e.annualSalary || 0));
    }
    
    console.log("Total Salary module USD:", tSal);
    
    // Find codes
    const salCode = await AccountCode.findOne({ companyCode, code: '61020' }); // Salary Expense
    const payCode = await AccountCode.findOne({ companyCode, code: '21500' }); // Due to directors/accrued payroll
    
    if (!salCode || !payCode) {
        console.log("Missing account codes 61020 or 21500.");
        process.exit();
    }
    
    // Delete any previous auto-sync
    await JournalEntry.deleteMany({ companyCode, description: 'Auto-Sync: TOS Salary' });
    
    const je = await JournalEntry.create({
        user: gamini._id, // Required!
        companyCode,
        date: new Date('2025-12-31T00:00:00Z'),
        description: 'Auto-Sync: TOS Salary',
        status: 'Posted',
        lines: [
            {
                accountCode: salCode._id,
                description: 'TOS Module Salary Expense Allocation',
                debit: tSal,
                credit: 0
            },
            {
                accountCode: payCode._id,
                description: 'Accrued Payroll Liability',
                debit: 0,
                credit: tSal
            }
        ]
    });
    
    console.log("Created Salary Journal Entry!", je._id);
    process.exit(0);
}
syncSalaryToGL();
