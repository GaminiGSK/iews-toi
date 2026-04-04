const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const CompanyProfile = require('./models/CompanyProfile');

async function testExtraction() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Exact same logic as trial-balance string extraction
    const profile = await CompanyProfile.findOne({ companyCode: 'RSW' });
    let nameEn = 'RSW';
    let nameKh = '';

    if (profile) {
        nameEn = profile.companyNameEn || (profile.extractedData?.get ? profile.extractedData.get('companyNameEn') : profile.extractedData?.companyNameEn) || '';
        nameKh = profile.companyNameKh || (profile.extractedData?.get ? profile.extractedData.get('companyNameKh') : profile.extractedData?.companyNameKh) || '';
        
        console.log('--- Initial Values ---');
        console.log('companyNameEn (raw DB):', profile.companyNameEn);
        console.log('companyNameKh (raw DB):', profile.companyNameKh);
        console.log('nameEn:', nameEn);
        console.log('nameKh:', nameKh);

        if (!nameEn && profile.organizedProfile) {
            console.log('Entering organizedProfile parsing because nameEn is empty...');
            const multiLineMatch = profile.organizedProfile.match(/\*\*Legal Name\*\*:[ \t]*\n\s*-\s*English:\s*([^\n]+)\n\s*-\s*Khmer:\s*([^\n]+)/i);
            const nameLinesMatch = profile.organizedProfile.match(/\*\*Legal Name\*\*\s*:\s*([^/!]+)\/\s*([^-\n]+)/i);
            
            if (multiLineMatch) {
                nameKh = nameKh || multiLineMatch[2].trim();
                nameEn = multiLineMatch[1].trim();
            } else if (nameLinesMatch) {
                nameKh = nameKh || nameLinesMatch[1].trim();
                nameEn = nameLinesMatch[2].trim();
            } else {
                const enMatch = profile.organizedProfile.match(/\*\*Legal Name\*\*\s*:\s*([^-\n]+)/i);
                if (enMatch) nameEn = enMatch[1].trim();
            }
        }
        if (!nameEn) nameEn = 'RSW';
    }
    
    console.log('\n--- Final Output for API Response ---');
    console.log('companyNameEn:', nameEn);
    console.log('companyNameKh:', nameKh);

    process.exit(0);
}
testExtraction();
