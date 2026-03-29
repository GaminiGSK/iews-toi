const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://admin_gsk:admingsk1235@ac-3keouu4-shard-00-00.pipzn70.mongodb.net:27017,ac-3keouu4-shard-00-01.pipzn70.mongodb.net:27017,ac-3keouu4-shard-00-02.pipzn70.mongodb.net:27017/gksmart_live?ssl=true&authSource=admin&retryWrites=true&w=majority')
    .then(async () => {
        const CompanyProfile = require('./models/CompanyProfile');
        const profiles = await CompanyProfile.find({});
        console.log("=== COMPREHENSIVE UNIT STATUS REPORT ===\n");
        profiles.forEach(p => {
            console.log(`Unit Code: ${p.companyCode}`);
            console.log(`Name EN: ${p.companyNameEn || "MISSING"}`);
            // Check extractedData object explicitly:
            const extData = Object.fromEntries(p.extractedData || new Map());
            console.log(`Extracted Name EN: ${extData.companyNameEn || "MISSING"}`);
            console.log(`Extracted Name KH: ${extData.companyNameKh || "MISSING"}`);
            console.log(`----------------------------------------`);
        });
        process.exit();
    })
    .catch(err => { console.error(err); process.exit(1); });
