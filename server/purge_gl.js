require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Transaction = require('./models/Transaction');
    
    console.log("Starting full GL purge to clear 104 duplicated cache rows...");
    const res = await Transaction.deleteMany({});
    console.log(`Purged ${res.deletedCount} transactions completely.`);
    console.log("GL is now reset for a clean ~40 row ingestion from the Bank Statement V2 bridge.");
    
    process.exit(0);
});
