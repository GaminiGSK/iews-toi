require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { extractRawText, extractDocumentData, summarizeToProfile } = require('./services/googleAI');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');

async function run() {
    const uri = 'mongodb://admin_gsk:admingsk1235@ac-3keouu4-shard-00-00.pipzn70.mongodb.net:27017,ac-3keouu4-shard-00-01.pipzn70.mongodb.net:27017,ac-3keouu4-shard-00-02.pipzn70.mongodb.net:27017/gksmart_live?ssl=true&authSource=admin&retryWrites=true&w=majority';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const cocoUser = await User.findOne({ username: { $regex: /coco/i } });
    if (!cocoUser) {
        console.log('COCO user not found');
        return process.exit(1);
    }
    console.log('Found user:', cocoUser.username);

    const profile = await CompanyProfile.findOne({ user: cocoUser._id });
    if (!profile || profile.documents.length === 0) {
        console.log('No profile or documents for COCO.');
        return process.exit(1);
    }

    // Process ALL documents because the universal extractor handles them uniformly
    const docsToProcess = profile.documents;

    if (docsToProcess.length === 0) {
        console.log('No documents found.');
        return process.exit(1);
    }

    let aggregatedData = {};
    let aggregatedRawText = '';

    for (let i = 0; i < docsToProcess.length; i++) {
        const doc = docsToProcess[i];
        console.log(`Processing document ${i+1}/${docsToProcess.length}:`, doc.originalName);

        if (!doc.data) {
            console.log('No base64 data, skipping.');
            continue;
        }

        const tmpPath = path.join(__dirname, `tmp_patent_${i}.pdf`);
        fs.writeFileSync(tmpPath, Buffer.from(doc.data, 'base64'));

        console.log('1. Extracting Raw Text...');
        const rawText = await extractRawText(tmpPath);
        
        console.log('3. Extracting Structured Data...');
        const structuredData = await extractDocumentData(tmpPath, 'mock');

        doc.rawText = rawText;
        doc.extractedData = structuredData;
        
        // Aggregate
        aggregatedRawText += `\n\n--- DOCUMENT: ${doc.originalName} ---\n\n` + rawText;
        for (const [key, val] of Object.entries(structuredData || {})) {
            // Keep meaningful values (arrays with length > 0, non-empty strings)
            if (Array.isArray(val) && val.length > 0) {
                aggregatedData[key] = val;
            } else if (!Array.isArray(val) && val !== null && val !== undefined && val !== '') {
                aggregatedData[key] = val;
            }
        }

        profile.markModified('documents');
        fs.unlinkSync(tmpPath);
    }

    console.log('2. Synthesizing MASTER Profile...');
    const masterProfile = await summarizeToProfile(aggregatedRawText, aggregatedData);

    console.log('\n--- LATEST ORGANIZED PROFILE ---\n');
    console.log(masterProfile);

    const setField = (key, val) => { if (val !== null && val !== undefined && val !== '') profile[key] = val; };
    const d = aggregatedData;
    setField('companyNameEn', d.companyNameEn);
    setField('companyNameKh', d.companyNameKh);
    setField('registrationNumber', d.registrationNumber || d.companyNumber);
    setField('incorporationDate', d.incorporationDate);
    setField('address', d.physicalAddress);
    setField('postalAddress', d.postalAddress);
    setField('contactEmail', d.contactEmail);
    setField('contactPhone', d.contactPhone);
    setField('businessActivity', d.businessActivities);
    setField('companyType', d.companyType);
    setField('vatTin', d.vatTin);
    setField('taxRegistrationDate', d.taxRegistrationDate);
    setField('bankName', d.bankName);
    setField('bankAccountNumber', d.bankAccountNumber);
    setField('bankAccountName', d.bankAccountName);
    setField('bankCurrency', d.bankCurrency);
    setField('registeredShareCapitalKHR', d.registeredShareCapitalKHR);
    setField('majorityNationality', d.majorityNationality);
    setField('percentageOfMajorityShareholders', d.percentageOfMajorityShareholders);

    if (Array.isArray(d.directors) && d.directors.length > 0) {
        profile.director = d.directors.map(dir => dir.nameEn || dir.nameKh).filter(Boolean).join(', ');
        profile.directors = d.directors;
    }
    if (Array.isArray(d.shareholders) && d.shareholders.length > 0) {
        profile.shareholder = d.shareholders.map(s => `${s.nameEn || s.nameKh} (${s.numberOfShares || 0} shares)`).filter(Boolean).join(', ');
        profile.shareholders = d.shareholders;
    }

    profile.organizedProfile = masterProfile;
    await profile.save();
    console.log('COCO Profile updated in live DB.');

    process.exit(0);
}

run().catch(console.error);
