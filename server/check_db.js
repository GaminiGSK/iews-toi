const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
require('dotenv').config({ path: './.env' });

async function query() {
    await mongoose.connect(process.env.MONGODB_URI);
    const yearlyStatsRaw = await Transaction.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: '%Y', date: '$date' } },
                income: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
                expense: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } }
            }
        },
        { $sort: { _id: -1 } }
    ]);
    console.log(yearlyStatsRaw);
    process.exit(0);
}
query();
