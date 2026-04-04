const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('./models/CompanyProfile');

async function checkProfiles() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const profiles = await CompanyProfile.find({});
    console.log(`Checking ${profiles.length} profiles...`);
    
    profiles.forEach(p => {
        let nameEn = p.companyNameEn || '';
        let nameKh = p.companyNameKh || '';
        if (!nameEn && p.extractedData) nameEn = p.extractedData.get ? p.extractedData.get('companyNameEn') : p.extractedData.companyNameEn;
        if (!nameKh && p.extractedData) nameKh = p.extractedData.get ? p.extractedData.get('companyNameKh') : p.extractedData.companyNameKh;
        
        let hasOrgKh = false;
        let extKh = '';
        if (p.organizedProfile) {
            const multiLineMatch = p.organizedProfile.match(/\*\*Legal Name\*\*:[ \t]*\n\s*-\s*English:\s*([^\n]+)\n\s*-\s*Khmer:\s*([^\n]+)/i);
            const nameLinesMatch = p.organizedProfile.match(/\*\*Legal Name\*\*\s*:\s*([^/!]+)\/\s*([^-\n]+)/i);
            if (multiLineMatch) extKh = multiLineMatch[2].trim();
            else if (nameLinesMatch) extKh = nameLinesMatch[1].trim();
            if (extKh) hasOrgKh = true;
        }

        if (hasOrgKh && !nameKh) {
            console.log(`[WARNING] Profile ${p.companyCode} HAS Khmer name in organized profile '${extKh}' but nameKh is EMPTY!`);
            console.log(`  -> nameEn is '${nameEn}'`);
        }
    });

    process.exit(0);
}
checkProfiles();
