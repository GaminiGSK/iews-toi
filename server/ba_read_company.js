/**
 * BA Auditor: Read company profile & BR documents from DB
 * This is what BA TOI / BA Auditor should do:
 * READ the actual registered documents to determine company type
 */
const mongoose = require('mongoose');

// Use same connection pattern as the main server
const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const db = mongoose.connection.db;
    
    const profile = await db.collection('companyprofiles').findOne({}, {
        projection: {
            companyNameEn: 1,
            companyNameKh: 1,
            vatTin: 1,
            registrationNumber: 1,
            'extractedData.company_name_en': 1,
            'extractedData.company_name_kh': 1,
            'documents.docType': 1,
            'documents.originalName': 1,
            'documents.rawText': 1,
        }
    });

    console.log('\n=== COMPANY PROFILE FROM DATABASE ===');
    console.log('companyNameEn    :', profile?.companyNameEn);
    console.log('companyNameKh    :', profile?.companyNameKh);
    console.log('TIN              :', profile?.vatTin);
    console.log('Registration No  :', profile?.registrationNumber);
    console.log('extracted EN name:', profile?.extractedData?.company_name_en);
    console.log('extracted KH name:', profile?.extractedData?.company_name_kh);

    console.log('\n=== BR DOCUMENTS (OCR Text — Company Name Lines) ===');
    const docs = profile?.documents || [];
    console.log('Total documents stored:', docs.length);
    for (const doc of docs) {
        console.log(`\n[${doc.docType}] ${doc.originalName}`);
        if (doc.rawText) {
            const relevant = doc.rawText.split('\n')
                .filter(l => /company|name|co\.|ltd|ក្រុមហ៊ុន|enterprise|sole|limited|GK|SMART|legal|form|registration/i.test(l))
                .slice(0, 8);
            relevant.forEach(l => console.log('  >', l.substring(0,120).trim()));
            if (relevant.length === 0) {
                // Show first 3 lines anyway
                doc.rawText.split('\n').slice(0,3).forEach(l => console.log('  >', l.substring(0,120).trim()));
            }
        } else {
            console.log('  (no rawText)');
        }
    }

    process.exit(0);
}

run().catch(e => { console.error('DB Error:', e.message); process.exit(1); });
