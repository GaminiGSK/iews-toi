const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/Antigravity/TOI/server/.env' });
const BankStatement = require('e:/Antigravity/TOI/server/models/BankStatement');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to MongoDB");

        const badDocs = await BankStatement.find({ 'transactions.description': { $regex: /^AI Parse Failed/ } });

        console.log(`Found ${badDocs.length} bank statements with corrupted AI parse.`);

        for (const doc of badDocs) {
            console.log("\n--- BAD DOCUMENT ---");
            console.log("ID:", doc._id);
            console.log("Original Name:", doc.originalName);
            console.log("Path:", doc.path);
            console.log("Drive ID:", doc.driveId);
            console.log("Company Code:", doc.companyCode);
            console.log("Uploaded At:", doc.createdAt);

            const badTx = doc.transactions.find(t => t.description && t.description.startsWith('AI Parse Failed'));
            if (badTx) {
                console.log("Error Description:", badTx.description.substring(0, 300));
            }
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}

run();
