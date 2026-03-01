const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function hardLink() {
    await mongoose.connect(process.env.MONGODB_URI);

    const rootId = "1ZpTcMOZYmzSsqo9CPXYmoOenn1bPMSLo";
    const bankId = "1hMLPd-Qw6XuHGHYSq8gmG4yUV5I05ASH";
    const brId = "1rfi5LRAP3P9J8fsj7CqMC0PTigmCqldS";

    console.log("Hard-linking GKSMART to your new folders...");

    const result = await User.updateOne(
        { username: 'GKSMART' },
        {
            $set: {
                driveFolderId: rootId,
                bankStatementsFolderId: bankId,
                brFolderId: brId
            }
        }
    );

    console.log(`✅ Updated GKSMART: ${result.modifiedCount} modification(s).`);
    process.exit(0);
}

hardLink();
