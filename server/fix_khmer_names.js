require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const CompanyProfile = require('./models/CompanyProfile');
    const profiles = await CompanyProfile.find({});
    
    let updated = 0;
    for (const profile of profiles) {
        let nameKh = profile.companyNameKh || '';
        let nameEn = profile.companyNameEn || '';
        
        let needsUpdate = false;
        
        if (!nameKh || nameKh === 'NAME' || nameKh.trim() === '' || nameKh === 'N/A') {
            if (profile.organizedProfile) {
                const multiLineMatch = profile.organizedProfile.match(/\*\*Legal Name\*\*:[ \t]*\n\s*-\s*English:\s*([^\n]+)\n\s*-\s*Khmer:\s*([^\n]+)/i);
                const nameLinesMatch = profile.organizedProfile.match(/\*\*Legal Name\*\*\s*:\s*([^/!]+)\/\s*([^-\n]+)/i);
                
                let parsedKh = '';
                if (multiLineMatch) {
                    parsedKh = multiLineMatch[2].trim();
                } else if (nameLinesMatch) {
                    // Usually "English / Khmer" or "Khmer / English" ?
                    // Let's check which one has khmer characters
                    const p1 = nameLinesMatch[1].trim();
                    const p2 = nameLinesMatch[2].trim();
                    
                    const khmerRegex = /[\u1780-\u17FF]/;
                    if (khmerRegex.test(p1)) parsedKh = p1;
                    else if (khmerRegex.test(p2)) parsedKh = p2;
                    else parsedKh = p2; // fallback
                }
                
                if (parsedKh && parsedKh !== 'NAME') {
                    profile.companyNameKh = parsedKh;
                    needsUpdate = true;
                    console.log(`Fixing ${profile.companyCode}: Khmer name set to ${parsedKh}`);
                }
            }
        }
        
        if (needsUpdate) {
            await profile.save();
            updated++;
        }
    }
    
    console.log(`Finished. Updated ${updated} profiles.`);
    process.exit(0);
});
