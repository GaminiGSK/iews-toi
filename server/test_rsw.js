const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Profile = mongoose.model('CompanyProfile', new mongoose.Schema({}, { strict: false }));
    const p = await Profile.findOne({ companyCode: /rsw/i }).lean();
    console.log("vatTin:", p.vatTin);
    console.log("director:", p.director);
    console.log("directorName:", p.directorName);
    console.log("address:", p.address);
    console.log("postalAddress:", p.postalAddress);
    console.log("structured address:", p.extractedData?.address);
    console.log("extractedData names:", Object.keys(p.extractedData || {}));
    console.log("incorporationDate:", p.incorporationDate);
    
    // Test the fallback parsing of TaxAgent vs company.js
    if (p.organizedProfile) {
        let activitiesStr = p.businessActivity || "";
        const activitySectionMatch = p.organizedProfile.match(/\*\*Business Activities\*\*:\s*([\s\S]*?)(?=\n#|\n\*\*|$)/i) || 
                                     p.organizedProfile.match(/\*\*2\.? My Business Activities\*\*[\s\S]*?([\s\S]*?)(?=\n#|\n\*\*|$)/i);
                                     
        if (activitySectionMatch && activitySectionMatch[1]) {
            const lines = activitySectionMatch[1].split('\n')
                .filter(line => /^\s*[-*]\s+/.test(line))
                .map(line => line.replace(/^\s*[-*]\s+/, '').trim());
            if (lines.length > 0) activitiesStr = lines.join('\n');
            console.log("Extracted Activities:", activitiesStr);
        }
    }
    process.exit(0);
});
