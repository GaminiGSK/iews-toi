const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const companyCode = 'GK_SMART_AI';
    const User = require('../models/User');
    const user = await User.findOne({ username: 'GKSMART' });
    if (!user) {
        console.log('User GKSMART not found');
        process.exit();
    }

    // Find some codes to use
    const codes = await AccountCode.find({ companyCode });
    if (codes.length === 0) {
        console.log('No codes found for company. Run seed-codes.js first or ensure companyCode is correct.');
        process.exit();
    }

    const rentCode = codes.find(c => c.description.toLowerCase().includes('rent')) || codes[0];
    const salaryCode = codes.find(c => c.description.toLowerCase().includes('salary')) || codes[1];
    const equipCode = codes.find(c => c.description.toLowerCase().includes('equipment')) || codes[2];
    const revCode = codes.find(c => c.description.toLowerCase().includes('revenue')) || codes[3];

    const transactions = [];
    const months = 12;

    for (let m = 0; m < months; m++) {
        const date = new Date(2026, m, 15);

        // Revenue (Positive)
        transactions.push({
            date,
            description: `Monthly Revenue - ${m + 1}`,
            amount: 5000 + (Math.random() * 2000),
            accountCode: revCode._id,
            companyCode,
            user: user._id,
            tagSource: 'rule'
        });

        // Rent (Negative)
        transactions.push({
            date,
            description: `Office Rent - ${m + 1}`,
            amount: -800,
            accountCode: rentCode._id,
            companyCode,
            user: user._id,
            tagSource: 'rule'
        });

        // Salary (Negative)
        transactions.push({
            date,
            description: `Staff Salaries - ${m + 1}`,
            amount: -3000,
            accountCode: salaryCode._id,
            companyCode,
            user: user._id,
            tagSource: 'rule'
        });
    }

    // Add some equipment in Jan
    transactions.push({
        date: new Date(2026, 0, 5),
        description: 'New Laptops Purchase',
        amount: -2500,
        accountCode: equipCode._id,
        companyCode,
        user: user._id,
        tagSource: 'manual'
    });

    console.log(`Seeding ${transactions.length} transactions...`);
    await Transaction.insertMany(transactions);
    console.log('Seeding complete!');
    process.exit();
}

seed();
