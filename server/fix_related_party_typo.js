/**
 * fix_related_party_typo.js
 * Removes the duplicate typo entry "Gunasingha Kasspa Gamini" from GKSMART's
 * Related Party documents, keeping the correct "Gunasingha Kassapa Gamini".
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Try to load the RelatedParty model
let RelatedParty;
try {
    RelatedParty = require('./models/RelatedParty');
} catch (e) {
    // Define inline if model file path differs
    const schema = new mongoose.Schema({}, { strict: false });
    RelatedParty = mongoose.models.RelatedParty || mongoose.model('RelatedParty', schema);
}

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all RelatedParty docs belonging to GKSMART
    const docs = await RelatedParty.find({ username: 'GKSMART' });
    console.log(`Found ${docs.length} RelatedParty doc(s) for GKSMART`);

    const TYPO   = 'Gunasingha Kasspa Gamini';   // WRONG — delete
    const CORRECT = 'Gunasingha Kassapa Gamini';  // RIGHT — keep

    let totalRemoved = 0;

    for (const doc of docs) {
        console.log(`\nDoc _id: ${doc._id}, name: "${doc.name}", relationship: "${doc.relationship}"`);

        // Case 1: the doc itself IS the typo entry — delete the whole document
        if (doc.name && doc.name.trim() === TYPO) {
            console.log(`  ❌ Deleting typo document`);
            await RelatedParty.deleteOne({ _id: doc._id });
            totalRemoved++;
            continue;
        }

        // Case 2: the doc has a nested "parties" array with the typo
        if (Array.isArray(doc.parties)) {
            const before = doc.parties.length;
            doc.parties = doc.parties.filter(p => p.name && p.name.trim() !== TYPO);
            const after = doc.parties.length;
            if (before !== after) {
                console.log(`  ❌ Removed ${before - after} typo entry/entries from parties array`);
                await doc.save();
                totalRemoved += (before - after);
            } else {
                console.log(`  ✅ No typo found in parties array`);
            }
        }
    }

    // Also do a global search in case it's under a different field
    const bulkResult = await RelatedParty.deleteMany({
        $or: [
            { name: TYPO },
            { name: { $regex: /Kasspa/i } }
        ]
    });
    if (bulkResult.deletedCount > 0) {
        console.log(`\n🗑  Bulk delete removed ${bulkResult.deletedCount} additional doc(s) matching typo`);
        totalRemoved += bulkResult.deletedCount;
    }

    console.log(`\n✅ Done. Total removed: ${totalRemoved}`);

    // Verify correct entry still exists
    const verify = await RelatedParty.findOne({ name: CORRECT });
    if (verify) {
        console.log(`✅ Correct entry "${CORRECT}" still exists — _id: ${verify._id}`);
    } else {
        console.log(`⚠️  Correct entry "${CORRECT}" not found — may be stored differently`);
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
