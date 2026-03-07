const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/Antigravity/TOI/server/.env' });
const BankStatement = require('e:/Antigravity/TOI/server/models/BankStatement');

async function run() {
    console.log('Connecting to: ', process.env.MONGODB_URI ? 'URI FOUND' : 'URI MISSING');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });

    // Find all bank statements that have a transaction with the AI Parse Failed desc
    const badDocs = await BankStatement.find({ 'transactions.description': { $regex: /^AI Parse Failed/ } });
    console.log(`Found ${badDocs.length} bank statements with corrupted AI parse.`);

    let deletedCount = 0;
    for (const doc of badDocs) {
        if (doc.transactions.length === 1 && doc.transactions[0].description.startsWith('AI Parse Failed')) {
            console.log(`Deleting entire statement: ${doc._id} (${doc.originalName})`);
            await BankStatement.deleteOne({ _id: doc._id });
            deletedCount++;
        } else {
            console.log(`Modifying statement (removing bad rows only): ${doc._id}`);
            doc.transactions = doc.transactions.filter(t => !t.description || !t.description.startsWith('AI Parse Failed'));
            await doc.save();
            deletedCount++;
        }
    }
    console.log(`Successfully processed ${deletedCount} documents.`);
    process.exit(0);
}

run();
