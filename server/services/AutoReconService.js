const mongoose = require('mongoose');
const JournalEntry = require('../models/JournalEntry');
const AccountCode = require('../models/AccountCode');
const SalaryModule = require('../models/SalaryModule');
const AssetModule = require('../models/AssetModule');
const User = require('../models/User');

// Dynamically sync Salary & Asset modules to the GL (Journal entries)
async function syncModulesToGL(companyCode) {
    if (!companyCode) return;

    try {
        const adminUser = await User.findOne({ companyCode });
        const userId = adminUser ? adminUser._id : null;

        // --- 1. SYNC SALARY MODULE ---
        const salary = await SalaryModule.findOne({ companyCode });
        let tSal = 0;
        if (salary) {
            if (salary.shareholderEmployees) {
                salary.shareholderEmployees.forEach(e => tSal += parseFloat(e.annualSalary || 0));
            }
            if (salary.nonShareholderEmployees) {
                salary.nonShareholderEmployees.forEach(e => tSal += parseFloat(e.annualSalary || 0));
            }
        }

        const salCode = await AccountCode.findOne({ companyCode, code: '61020' }); // Salary Expense
        const payCode = await AccountCode.findOne({ companyCode, code: '21500' }); // Accrued Payroll
        
        if (salCode && payCode && tSal > 0) {
            // Check if existing auto-sync JE matches exactly to prevent unnecessary DB writes
            const existingSalJE = await JournalEntry.findOne({ companyCode, description: 'Auto-Sync: TOS Salary' });
            let needsUpdate = true;
            if (existingSalJE && existingSalJE.lines[0]?.debit === tSal) {
                needsUpdate = false;
            }

            if (needsUpdate) {
                await JournalEntry.deleteMany({ companyCode, description: 'Auto-Sync: TOS Salary' });
                await JournalEntry.create({
                    user: userId,
                    companyCode,
                    date: new Date('2025-12-31T00:00:00Z'),
                    description: 'Auto-Sync: TOS Salary',
                    status: 'Posted',
                    lines: [
                        { accountCode: salCode._id, description: 'TOS Module Salary Expense Allocation', debit: tSal, credit: 0 },
                        { accountCode: payCode._id, description: 'Accrued Payroll Liability', debit: 0, credit: tSal }
                    ]
                });
            }
        } else if (tSal === 0) {
            await JournalEntry.deleteMany({ companyCode, description: 'Auto-Sync: TOS Salary' });
        }

        // --- 2. SYNC ASSET MODULE (DEPRECIATION) ---
        const assets = await AssetModule.findOne({ companyCode });
        let tDep = 0;
        if (assets && assets.assets) {
            assets.assets.forEach(a => {
                const rates = { Building: 5, Furniture: 10, Computer: 25, Vehicle: 20, Other: 20 };
                const r = rates[a.category] || 10;
                const b = (parseFloat(a.cost)||0) + (parseFloat(a.additions)||0) - (parseFloat(a.disposals)||0);
                tDep += (b * r / 100);
            });
        }

        const depExpCode = await AccountCode.findOne({ companyCode, code: '61300' }); // Dep Expense
        const accDepCode = await AccountCode.findOne({ companyCode, code: '17260' }); // Acc Dep Computer (Placeholder)
        // In a perfect system, we'd split it by category. For now, dumping it into a general Acc Dep or fixing it dynamically.

        if (depExpCode && accDepCode && tDep > 0) {
            const existingDepJE = await JournalEntry.findOne({ companyCode, description: 'Auto-Sync: Asset Depreciation' });
            let depNeedsUpdate = true;
            if (existingDepJE && existingDepJE.lines[0]?.debit === tDep) {
                depNeedsUpdate = false; 
            }

            if (depNeedsUpdate) {
                await JournalEntry.deleteMany({ companyCode, description: 'Auto-Sync: Asset Depreciation' });
                await JournalEntry.create({
                    user: userId,
                    companyCode,
                    date: new Date('2025-12-31T00:00:00Z'),
                    description: 'Auto-Sync: Asset Depreciation',
                    status: 'Posted',
                    lines: [
                        { accountCode: depExpCode._id, description: 'Asset Module Total Depreciation', debit: tDep, credit: 0 },
                        { accountCode: accDepCode._id, description: 'Accumulated Depreciation', debit: 0, credit: tDep }
                    ]
                });
            }
        } else if (tDep === 0) {
             await JournalEntry.deleteMany({ companyCode, description: 'Auto-Sync: Asset Depreciation' });
        }

    } catch (err) {
        console.error("AutoReconService Error:", err);
    }
}

module.exports = { syncModulesToGL };
