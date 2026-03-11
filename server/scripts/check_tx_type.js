const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const stringAmountTx = await db.collection('transactions').findOne({ amount: { $type: 'string' } });
    console.log("String amount:", stringAmountTx);
    process.exit(0);
});
