const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const AccountCode = require('./models/AccountCode');

dotenv.config();

async function syncCodes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Get GKSMART codes
        const gkUser = await User.findOne({ companyCode: 'GK_SMART_AI' });
        if (!gkUser) {
            console.error("GKSMART user not found.");
            process.exit(1);
        }

        const gkCodes = await AccountCode.find({ companyCode: 'GK_SMART_AI' }).lean();
        if (gkCodes.length === 0) {
            console.error("GKSMART has no account codes to copy from.");
            process.exit(1);
        }
        console.log(`Found ${gkCodes.length} master codes from GKSMART`);

        // 2. Get all users
        const allUsers = await User.find({ username: { $nin: ['Admin', 'ADMIN', 'superadmin'] } });
        console.log(`Found ${allUsers.length} total target users (excluding core admins).`);

        let updatedUsers = 0;

        // 3. Sync to all
        for (const targetUser of allUsers) {
            if (targetUser.companyCode === 'GK_SMART_AI') continue; // Skip master

            const companyCode = targetUser.companyCode;
            let ops = 0;

            for (const masterCode of gkCodes) {
                // Upsert: Match on companyCode and TOI/code
                await AccountCode.findOneAndUpdate(
                    { companyCode: companyCode, code: masterCode.code },
                    { 
                        $set: {
                            user: targetUser._id,
                            toiCode: masterCode.toiCode,
                            description: masterCode.description,
                            matchDescription: masterCode.matchDescription
                        }
                        // Note: deliberately not touching priorYearDr, priorYearCr, or note
                    },
                    { upsert: true, new: true }
                );
                ops++;
            }
            console.log(`Synced ${ops} codes to ${companyCode}`);
            updatedUsers++;
        }

        console.log(`\nSuccessfully applied GKSMART account codes and AI rules to ${updatedUsers} users.`);
        process.exit(0);

    } catch (e) {
        console.error("Error running sync script:", e.stack);
    }
}

syncCodes();
