const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function totalCleanup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to:', mongoose.connection.name);

        const models = {
            CompanyProfile: require('../models/CompanyProfile'),
            User: require('../models/User'),
            BankFile: require('../models/BankFile'),
            Transaction: require('../models/Transaction'),
            TaxPackage: require('../models/TaxPackage'),
            AccountCode: require('../models/AccountCode'),
            ExcelDocument: require('../models/ExcelDocument'),
            JournalEntry: require('../models/JournalEntry')
        };

        for (const [name, Model] of Object.entries(models)) {
            let result;
            if (name === 'User') {
                // Keep Admin, delete others
                console.log(`Cleaning up ${name} (except Admin)...`);
                result = await Model.deleteMany({ username: { $ne: 'Admin' } });
            } else if (name === 'TaxPackage') {
                // Clear the data map but keep the entries? No, user said "total clean up we will rebuilt"
                console.log(`Cleaning up ${name}...`);
                result = await Model.deleteMany({});
            } else {
                console.log(`Cleaning up ${name}...`);
                result = await Model.deleteMany({});
            }
            console.log(`- Deleted ${result.deletedCount} ${name}.`);
        }

        console.log('Cleanup complete.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Cleanup failed:', err);
    }
}

totalCleanup();
