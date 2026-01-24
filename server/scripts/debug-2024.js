const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const ExchangeRate = require('../models/ExchangeRate');
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find the user/company
        // Assuming first user for now or find by code if known
        const user = await User.findOne({});
        if (!user) { console.log('No user found'); return; }

        console.log(`Checking Company: ${user.companyCode}`);

        // 1. Check Rates
        const rates = await ExchangeRate.find({ companyCode: user.companyCode });
        console.log('Exchange Rates found:', rates);

        // 2. Check Transactions by Year
        const transactions = await Transaction.find({ companyCode: user.companyCode });
        console.log(`Total Transactions: ${transactions.length}`);

        const yearCounts = {};
        let invalidDates = 0;

        transactions.forEach(t => {
            if (!t.date) {
                invalidDates++;
                return;
            }
            const y = new Date(t.date).getFullYear();
            if (isNaN(y)) {
                invalidDates++;
            } else {
                yearCounts[y] = (yearCounts[y] || 0) + 1;
            }
        });

        console.log('Transactions by Year:', yearCounts);
        console.log('Invalid/Missing Dates:', invalidDates);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
