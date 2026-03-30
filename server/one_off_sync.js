const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function syncCodes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");
        
        const User = require('./models/User');
        const AccountCode = require('./models/AccountCode');
        
        // 1. Get RSW codes
        const rswCodes = await AccountCode.find({ companyCode: 'RSW' }).lean();
        if (rswCodes.length === 0) {
            console.error("RSW has no account codes to copy from.");
            process.exit(1);
        }
        console.log(`Found ${rswCodes.length} master codes from RSW...`);

        const allUsers = await User.find({ username: { $nin: ['Admin', 'ADMIN', 'superadmin'] } });
        let updatedUsers = 0;
        let totalOps = 0;

        for (const targetUser of allUsers) {
            if (targetUser.companyCode === 'RSW') continue;
            if (!targetUser.companyCode) continue;

            const companyCode = targetUser.companyCode;
            for (const masterCode of rswCodes) {
                await AccountCode.findOneAndUpdate(
                    { companyCode: companyCode, code: masterCode.code },
                    { 
                        $set: {
                            user: targetUser._id,
                            toiCode: masterCode.toiCode,
                            description: masterCode.description,
                            matchDescription: masterCode.matchDescription
                        }
                    },
                    { upsert: true, new: true }
                );
                totalOps++;
            }
            updatedUsers++;
            console.log(`Synced ${rswCodes.length} codes to ${companyCode}`);
        }

        console.log(`\nSUCCESS! Synced ${rswCodes.length} codes to ${updatedUsers} companies. (${totalOps} specific documents updated)`);
        process.exit(0);
    } catch (err) {
        console.error("Network or script error:", err);
        process.exit(1);
    }
}

syncCodes();
