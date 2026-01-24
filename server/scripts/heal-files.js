const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const heal = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const bankFiles = await db.collection('bankfiles').find({}).toArray();

        console.log(`Found ${bankFiles.length} files. Starting heal process...`);

        for (const file of bankFiles) {
            // 1. Generate Link ID if missing
            let linkId = file.driveId;
            if (!linkId) {
                linkId = `fixed-${file._id.toString()}`;
                await db.collection('bankfiles').updateOne(
                    { _id: file._id },
                    { $set: { driveId: linkId } }
                );
                console.log(`Updated File ${file.originalName} with Link ID: ${linkId}`);
            }

            // 2. Parse Date Range from Name
            // Format: 003102780_01Apr2024_30Jun2024_...
            const name = file.originalName;
            const datePart = name.split('_').slice(1, 3); // ['01Apr2024', '30Jun2024']

            if (datePart.length >= 2) {
                const startStr = datePart[0]; // e.g. 01Apr2024
                const endStr = datePart[1];   // e.g. 30Jun2024

                // Helper to parse "01Apr2024"
                const parseCustom = (s) => {
                    // Hacky regex: (\d{2})([A-Za-z]{3})(\d{4})
                    const match = s.match(/(\d{2})([A-Za-z]{3})(\d{4})/);
                    if (match) {
                        return new Date(`${match[1]} ${match[2]} ${match[3]}`);
                    }
                    return null;
                };

                const start = parseCustom(startStr);
                const end = parseCustom(endStr);

                if (start && end) {
                    // Set end to end of day
                    end.setHours(23, 59, 59, 999);

                    console.log(`Scanning for transactions between ${start.toISOString()} and ${end.toISOString()}...`);

                    // 3. Find Orphans matching range
                    // We check txs where originalData.driveId is NULL or MISSING
                    const query = {
                        date: { $gte: start, $lte: end },
                        $or: [
                            { "originalData.driveId": { $exists: false } },
                            { "originalData.driveId": null },
                            { "originalData.driveId": "" }
                        ]
                    };

                    const txs = await db.collection('transactions').find(query).toArray();
                    console.log(`Found ${txs.length} orphans for this file.`);

                    if (txs.length > 0) {
                        // 4. Update them
                        const ids = txs.map(t => t._id);
                        await db.collection('transactions').updateMany(
                            { _id: { $in: ids } },
                            { $set: { "originalData.driveId": linkId } }
                        );
                        console.log(`Simulated 'Move' of ${txs.length} transactions to File Tab.`);
                    }

                } else {
                    console.log(`Skipping date parse fail: ${name}`);
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

heal();
