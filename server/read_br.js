require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Get company profile
    const profile = await db.collection('companyprofiles').findOne({}, {
        projection: {
            companyNameEn: 1,
            companyNameKh: 1,
            registrationNumber: 1,
            incorporationDate: 1,
            vatTin: 1,
            'extractedData.company_name_en': 1,
            'extractedData.company_name_kh': 1,
            'extractedData.registration_number': 1,
            // Documents with OCR text
            'documents.docType': 1,
            'documents.originalName': 1,
            'documents.rawText': 1,
        }
    });

    console.log('\n=== COMPANY PROFILE ===');
    console.log('companyNameEn:', profile?.companyNameEn);
    console.log('companyNameKh:', profile?.companyNameKh);
    console.log('registrationNumber:', profile?.registrationNumber);
    console.log('vatTin:', profile?.vatTin);
    console.log('extractedData.company_name_en:', profile?.extractedData?.company_name_en);
    console.log('extractedData.company_name_kh:', profile?.extractedData?.company_name_kh);

    console.log('\n=== BR DOCUMENTS ===');
    for (const doc of (profile?.documents || [])) {
        console.log(`\n--- ${doc.docType} (${doc.originalName}) ---`);
        if (doc.rawText) {
            // Show first 500 chars with company name mentions
            const lines = doc.rawText.split('\n').filter(l => 
                /company|name|co\.|ltd|ក្រុមហ៊ុន|enterprise|sole|limited|GK|SMART/i.test(l)
            ).slice(0, 10);
            lines.forEach(l => console.log('  >', l.trim()));
        }
    }

    process.exit(0);
}).catch(e => { console.log('Error:', e.message); process.exit(1); });
