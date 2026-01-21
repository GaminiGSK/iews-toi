const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const AccountCode = require('../models/AccountCode');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iews_toi';

const codesToInsert = [
    { code: '10110', toiCode: 'A21', description: 'Cash on hand' },
    { code: '10130', toiCode: 'A22', description: 'ABA' },
    { code: '11010', toiCode: 'A18', description: 'ACCOUNT RECEIVABLE' },
    { code: '13011', toiCode: 'A20', description: 'Prepaid Insurance' },
    { code: '13021', toiCode: 'A20', description: 'Deposit' },
    { code: '13030', toiCode: 'A23', description: 'Credit on Prepayment on tax' },
    { code: '14060', toiCode: 'A24', description: 'VAT INPUT 10%' }, // Assumed A24 based on typical context
    { code: '14070', toiCode: 'A26', description: 'Staff Advance' },
    { code: '17230', toiCode: 'A12', description: 'COST OF FURNITURE' },
    { code: '17240', toiCode: 'A12', description: 'Acc Dep of Furniture' },
    { code: '17250', toiCode: 'A12', description: 'COST OF COMPUTER' },
    { code: '17260', toiCode: 'A12', description: 'ACC DEP OF COMPUTER' },
    { code: '17270', toiCode: 'A12', description: 'COST OF OFFICE EQUIPMENT' },
    { code: '17280', toiCode: 'A12', description: 'Acc Dep of Equipment' },
    { code: '17290', toiCode: 'A12', description: 'COST OF AUTOMOBILE' },
    { code: '17300', toiCode: 'A12', description: 'ACC DEP OF AUTOMOBILE' },
    { code: '17310', toiCode: 'A12', description: 'COST OF OTHER DEP' },
    { code: '17320', toiCode: 'A12', description: 'ACC DEP OF OTHER PRO' },
    // Revenue & Expenses
    { code: '40000', toiCode: 'B3', description: 'Service Revenues' },
    { code: '52031', toiCode: 'B6', description: 'Cost of Electrical Item' },
    { code: '52032', toiCode: 'B6', description: 'Cost of Small Equipment &' },
    { code: '52041', toiCode: 'B6', description: 'COGS-Service Installation' },
    { code: '61020', toiCode: 'B23', description: 'Payroll Expenses' },
    { code: '61030', toiCode: 'B24', description: 'Fuel, electricity and water' },
    { code: '61041', toiCode: 'B41', description: 'Office Supply' },
    { code: '61042', toiCode: 'B41', description: 'Monthly Security Expense' },
    { code: '61043', toiCode: 'B41', description: 'Staff Uniform' },
    { code: '61044', toiCode: 'B41', description: 'First Aid' },
    { code: '61045', toiCode: 'B33', description: 'Staff Trainning' },
    { code: '61046', toiCode: 'B41', description: 'Prepaid Expense' },
    { code: '61050', toiCode: 'B25', description: 'Travelling and accommodation' },
    { code: '61051', toiCode: 'B29', description: 'Meal expense' },
    { code: '61060', toiCode: 'B26', description: 'Transportation expenses' },
    { code: '61070', toiCode: 'B27', description: 'Rental expenses' },
    { code: '61080', toiCode: 'B28', description: 'Repair and maintenance' },
    { code: '61081', toiCode: 'B28', description: 'Service Repair and maintenance' },
    { code: '61090', toiCode: 'B29', description: 'Entertainment expenses' },
    { code: '61100', toiCode: 'B30', description: 'Commission, advertising' },
    { code: '61160', toiCode: 'B36', description: 'Amortisation/depletion' },
    { code: '61220', toiCode: 'B41', description: 'BANK CHARGE' },
    { code: '61231', toiCode: 'B43', description: 'Internet expense' },
    { code: '61240', toiCode: 'B33', description: 'Management, consultant' },
    { code: '61241', toiCode: 'B33', description: 'Business Register' },
    { code: '61242', toiCode: 'B31', description: 'Tax Register' },
    { code: '61243', toiCode: 'B31', description: 'Patent' },
    { code: '61244', toiCode: 'B31', description: 'Non-Deductable Expense' },
    { code: '61250', toiCode: 'B47', description: 'Profit tax' }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a target user/company
        // Defaulting to searching for any user to apply this to their company
        const user = await User.findOne();
        if (!user) {
            console.log('No user found to seed');
            process.exit(1);
        }

        console.log(`Seeding codes for Company: ${user.companyCode} (User: ${user.email})`);

        let added = 0;
        let skipped = 0;

        for (const item of codesToInsert) {
            try {
                await AccountCode.findOneAndUpdate(
                    { companyCode: user.companyCode, code: item.code },
                    {
                        user: user._id,
                        companyCode: user.companyCode,
                        code: item.code,
                        toiCode: item.toiCode,
                        description: item.description
                    },
                    { upsert: true, new: true }
                );
                added++;
            } catch (e) {
                console.error(`Error adding ${item.code}:`, e.message);
                skipped++;
            }
        }

        console.log(`Finished. Added/Updated: ${added}, Skipped/Error: ${skipped}`);
        process.exit(0);

    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
}

seed();
