/**
 * push_saila_profile.js
 * Pushes SAI LA (CAMBODIA) TRADING CO., LTD. full profile
 * to the SKRANA unit via the live Cloud Run API.
 * 
 * Run: node push_saila_profile.js [unitUsername] [loginCode]
 * 
 * Example:
 *   node push_saila_profile.js skrana 111111
 */
const https = require('https');

const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

// ── UNIT TO UPDATE ───────────────────────────────────────────
const TARGET_UNIT = process.argv[2] || 'skrana';
const UNIT_CODE   = process.argv[3] || '111111';

// ── THE FULL COMPANY PROFILE FROM MoC PORTAL ────────────────
const PROFILE = {
    // ── Core Names (Bilingual — both required for TOI filing)
    companyNameEn: 'SAI LA (CAMBODIA) TRADING CO., LTD.',
    companyNameKh: 'សៃ ឡា (ខែមបូដា) ក្រូមើន ខ.ក',

    // ── Registration
    registrationNumber:    '00075323',
    oldRegistrationNumber: '1000437432',    // Original Entity Identifier
    incorporationDate:     '04-Nov-2024',
    companyType:           'Private Limited Company',

    // ── Business Activities
    businessActivity: '47711 - Retail sale of articles of clothing and accessories',

    // ── Addresses
    address: 'ការ្រាន ប៊ិចមួន ១០វិទ្យុ ផ្នែក ០១, ន.0៣, 0៣, ស្រុកមេរ, ភ្នំពេញ, 12415, Cambodia',

    // ── Contact
    contactEmail: 'schen@zytoys.cn',
    contactPhone: '(+855) 96-6789789',

    // ── Tax
    vatTin: '',                            // Not yet issued
    taxRegistrationDate: '',

    // ── Director
    director: 'Chen QINGQING',

    // ── Structured Director Entry
    directors: [{
        nameEn: 'Chen QINGQING',
        nameKh: 'ចិននានមំរោញ',            // From Khmer: Chen QINGQING
        address: 'No.1, Dinglin Middle Road, Dingyan Town, Rugao City, Jiangsu Province, China',
        isChairman: true
    }],

    // ── Nationality
    majorityNationality: 'Chinese',

    // ── Dynamic extractedData (maps to TOI form fields)
    extractedData: {
        nameEn:              'SAI LA (CAMBODIA) TRADING CO., LTD.',
        name:                'សៃ ឡា (ខែមបូដា) ក្រូមើន ខ.ក',
        regNumber:           '00075323',
        entityId:            '1000437432',
        incorporationDate:   '04-Nov-2024',
        reRegistrationDate:  '18-Nov-2024',
        address:             'ការ្រាន ប៊ិចមួន ១០វិទ្យុ ផ្នែក ០១, ន.0៣, ស្រុកមេរ, ភ្នំពេញ, 12415',
        email:               'schen@zytoys.cn',
        phone:               '(+855) 96-6789789',
        directorNameEn:      'Chen QINGQING',
        directorNationality: 'Chinese',
        businessActivity:    '47711 - Retail sale of clothing and accessories',
        companyStatus:       'Registered'
    }
};

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

async function main() {
    console.log(`\n📋 Profile Pusher — Target: ${TARGET_UNIT}\n`);

    // Step 1: Login as the unit
    console.log(`▶ Logging in as ${TARGET_UNIT} (${UNIT_CODE})...`);
    const loginRes = await apiCall('POST', '/api/auth/login', { username: TARGET_UNIT, code: UNIT_CODE });
    if (!loginRes.data.token) {
        console.error('❌ Login failed:', loginRes.data);
        process.exit(1);
    }
    const token = loginRes.data.token;
    const userInfo = loginRes.data.user;
    console.log(`  ✅ Logged in: ${userInfo.username} | role: ${userInfo.role} | companyCode: ${userInfo.companyCode}`);

    // Step 2: Push the profile
    console.log(`\n▶ Pushing profile to ${TARGET_UNIT}...`);
    const updateRes = await apiCall('POST', '/api/company/update-profile', PROFILE, token);
    
    if (updateRes.status === 200) {
        const p = updateRes.data.profile;
        console.log('\n✅ Profile saved successfully!');
        console.log(`   companyNameEn: ${p?.companyNameEn}`);
        console.log(`   companyNameKh: ${p?.companyNameKh}`);
        console.log(`   regNumber:     ${p?.registrationNumber}`);
        console.log(`   director:      ${p?.director}`);
        console.log(`   address:       ${p?.address}`);
    } else {
        console.error('❌ Update failed:', updateRes.data);
    }

    // Step 3: Verify GL company name will show correctly
    console.log(`\n▶ Verifying GL ledger name response...`);
    const ledgerRes = await apiCall('GET', '/api/company/ledger', null, token);
    if (ledgerRes.data) {
        console.log(`  GL companyNameEn: ${ledgerRes.data.companyNameEn}`);
        console.log(`  GL companyNameKh: ${ledgerRes.data.companyNameKh}`);
        const correct = ledgerRes.data.companyNameEn === 'SAI LA (CAMBODIA) TRADING CO., LTD.';
        console.log(`  ${correct ? '✅ GL will print CORRECT name!' : '⚠️  Name mismatch — check profile'}`);
    }

    console.log('\n🏁 Done.\n');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
