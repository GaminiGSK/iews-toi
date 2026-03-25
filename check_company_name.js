require('dotenv').config({ path: 'server/.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const r = await mongoose.connection.db.collection('companyprofiles').findOne({}, {
        projection: { companyNameEn: 1, companyNameKh: 1, 'extractedData.company_name_en': 1, 'extractedData.company_name_kh': 1 }
    });
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
}).catch(e => { console.log(e.message); process.exit(1); });
