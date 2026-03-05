require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

async function getBal() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const txns = await Transaction.find({}).sort({ date: -1 }).limit(10);
        txns.forEach(t => {
            console.log(`${t.date.toISOString().split('T')[0]} | Bal: ${t.balance} | Orig: ${t.originalData?.balance}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
getBal();
