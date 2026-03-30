require('dotenv').config();
const mongoose = require('mongoose');

async function fixMissingCodes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const AccountCode = require('./models/AccountCode');
        const User = require('./models/User');

        console.log('[Fix] Starting zero-code unit repair...');

        // 1. Get the master "golden" codes from RSW
        const masterCodes = await AccountCode.find({ companyCode: 'RSW' }).lean();
        if (!masterCodes || masterCodes.length === 0) {
            console.error('[Error] RSW has no codes. Cannot clone.');
            process.exit(1);
        }
        console.log(`[Fix] Found ${masterCodes.length} anchor codes from RSW.`);

        // 2. Find all users
        const allUsers = await User.find({});
        console.log(`[Fix] Checking ${allUsers.length} user profiles...`);

        for (const user of allUsers) {
            const codeCount = await AccountCode.countDocuments({ companyCode: user.companyCode });
            if (codeCount === 0) {
                console.log(`[Fix] -> Unit ${user.username} (${user.companyCode}) has 0 codes. Injecting ${masterCodes.length} codes...`);
                
                const newDocs = masterCodes.map(mc => ({
                    user: user._id,
                    companyCode: user.companyCode,
                    code: mc.code || 'NULL',
                    toiCode: mc.toiCode || '0000',
                    description: mc.description || 'Auto-generated code',
                    matchDescription: mc.matchDescription || '',
                    updatedBy: 'system',
                    priorYearDr: 0,
                    priorYearCr: 0
                }));

                await AccountCode.insertMany(newDocs);
                console.log(`[Fix] -> Success for ${user.username}.`);
            } else {
                console.log(`[Check] Unit ${user.username} has ${codeCount} codes. OK.`);
            }
        }

        console.log('[Fix] Completed.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixMissingCodes();
