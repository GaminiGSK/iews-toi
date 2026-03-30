/**
 * fix_skrana_profile.js
 * EMERGENCY: Removes wrong SAI LA data that was pushed into SKRANA's profile.
 * Clears companyNameEn, companyNameKh, and every SAI LA field from SKRANA.
 * The GL will then fall back to the User.companyName set by admin1.
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: HOST, path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const req = https.request(options, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, data: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function login(username, code) {
    const res = await apiCall('POST', '/api/auth/login', { username, code });
    if (!res.data.token) throw new Error(`Login failed for ${username}`);
    return res.data.token;
}

async function main() {
    console.log('\n🚨 SKRANA Profile Emergency Fix — Removing Wrong SAI LA Data\n');

    const token = await login('skrana', '111111');
    console.log('✅ Logged in as skrana');

    // Check what's currently in the profile
    const current = await apiCall('GET', '/api/company/profile', null, token);
    console.log('\nCurrent SKRANA profile:');
    console.log('  companyNameEn:', current.data?.companyNameEn);
    console.log('  companyNameKh:', current.data?.companyNameKh);
    console.log('  registrationNumber:', current.data?.registrationNumber);
    console.log('  director:', current.data?.director);

    // Clear wrong SAI LA fields — reset to empty so GL uses actual BR data
    const clearRes = await apiCall('POST', '/api/company/update-profile', {
        companyNameEn: '',
        companyNameKh: '',
        registrationNumber: '',
        oldRegistrationNumber: '',
        incorporationDate: '',
        companyType: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        director: '',
        majorityNationality: '',
        businessActivity: '',
        directors: [],
        extractedData: {}
    }, token);

    if (clearRes.status === 200) {
        console.log('\n✅ SAI LA data cleared from SKRANA profile');
    } else {
        console.error('❌ Clear failed:', clearRes.data);
    }

    // Verify GL now
    const ledger = await apiCall('GET', '/api/company/ledger', null, token);
    console.log('\n✅ GL now shows:');
    console.log('  companyNameEn:', ledger.data?.companyNameEn);
    console.log('  companyNameKh:', ledger.data?.companyNameKh);
    console.log('\n  (If blank — SKRANA unit needs to upload their BR document');
    console.log('   so AI can extract their real company name from it)\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
