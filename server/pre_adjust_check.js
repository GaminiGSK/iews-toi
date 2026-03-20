require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const companyCode = 'GK_SMART_AI';

    // Suspension transactions only
    const suspense = await db.collection('transactions').find({ companyCode, code: '99999' }).toArray();
    console.log('SUSPENSE_COUNT=' + suspense.length);
    for (const t of suspense) {
        const d = new Date(t.date).toISOString().slice(0,10);
        const amt = parseFloat(t.amount);
        console.log('S|' + d + '|' + amt.toFixed(2) + '|' + (t.description||'').replace(/\n/g,' ').slice(0,70));
    }

    // Profile
    const prof = await db.collection('companyprofiles').findOne({ companyCode });
    console.log('ABA_OPEN=' + (prof?.abaOpeningBalance || 'NOT_SET'));

    // Dep accounts existing?
    const depCodes = ['17231','17240','17251','17260','17280','17291','17300','17310','17320','61300','40100'];
    for (const c of depCodes) {
        const found = await db.collection('accountcodes').findOne({ companyCode, code: c });
        console.log('AC|' + c + '|' + (found ? found.description : 'NOT_FOUND'));
    }

    // existing JE descriptions
    const jes = await db.collection('journalentries').find({ companyCode }).project({ date:1, description:1, status:1 }).toArray();
    console.log('JE_COUNT=' + jes.length);
    for (const j of jes.slice(-5)) {
        console.log('JE|' + new Date(j.date).toISOString().slice(0,10) + '|' + j.status + '|' + (j.description||'').slice(0,50));
    }

    mongoose.disconnect();
}).catch(e => console.error('ERR:' + e.message));
