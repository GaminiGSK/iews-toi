/**
 * fix_related_party_api.js
 * Calls the live Cloud Run API to:
 * 1. Login as GKSMART
 * 2. GET related party data
 * 3. Remove the typo "Gunasingha Kasspa Gamini"
 * 4. POST back the clean data
 */
const https = require('https');

const BASE_URL = 'iews-toi-588941282431.asia-southeast1.run.app';
const USERNAME  = 'GKSMART';
const CODE      = '666666';
const TYPO_NAME = 'Gunasingha Kasspa Gamini';

function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: BASE_URL,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const req = https.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch (e) { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    // Step 1: Login
    console.log(`\n1️⃣  Logging in as ${USERNAME}...`);
    const loginRes = await apiCall('POST', '/api/auth/login', { username: USERNAME, code: CODE });
    if (loginRes.status !== 200 || !loginRes.body.token) {
        console.error('❌ Login failed:', loginRes.body);
        process.exit(1);
    }
    const token = loginRes.body.token;
    console.log(`✅ Logged in. Token: ${token.substring(0, 20)}...`);

    // Step 2: GET Related Party data
    console.log('\n2️⃣  Fetching Related Party data...');
    const getRes = await apiCall('GET', '/api/company/toi/related-party', null, token);
    if (getRes.status !== 200) {
        console.error('❌ GET failed:', getRes.body);
        process.exit(1);
    }
    const record = getRes.body.data;
    if (!record) {
        console.log('⚠️  No related party record found for GKSMART');
        process.exit(0);
    }
    const parties = record.parties || [];
    console.log(`   Found ${parties.length} parties:`);
    parties.forEach((p, i) => console.log(`   [${i}] "${p.name}" — ${p.relationship || p.role || 'unknown'}`));

    // Step 3: Filter out typo
    const before = parties.length;
    const cleanParties = parties.filter(p => {
        const nameMatch = (p.name || '').trim() === TYPO_NAME;
        if (nameMatch) console.log(`\n❌ Removing typo entry: "${p.name}"`);
        return !nameMatch;
    });
    const after = cleanParties.length;

    if (before === after) {
        console.log(`\n✅ No typo entry found — nothing to remove.`);
        process.exit(0);
    }
    console.log(`\n   Removed ${before - after} entry/entries.`);

    // Step 4: POST back clean data
    console.log('\n3️⃣  Saving clean data...');
    const payload = {
        ...record.toObject ? record.toObject() : record,
        parties: cleanParties
    };
    // Remove MongoDB internal fields
    delete payload._id;
    delete payload.__v;
    delete payload.companyCode; // server sets this from auth token

    const postRes = await apiCall('POST', '/api/company/toi/related-party', payload, token);
    if (postRes.status !== 200) {
        console.error('❌ POST failed:', postRes.body);
        process.exit(1);
    }
    const saved = postRes.body.data;
    console.log(`✅ Saved. Remaining parties: ${(saved.parties || []).length}`);
    (saved.parties || []).forEach((p, i) => console.log(`   [${i}] "${p.name}"`));

    console.log('\n✅ Done — typo entry removed successfully!');
}

run().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
