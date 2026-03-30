/**
 * fix_skrana_real_name.js
 * Pushes the REAL company name extracted from SKRANA's own BR document.
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

async function main() {
    console.log('\n🔧 Fixing SKRANA with REAL company name from their own BR\n');

    // Login as skrana unit directly
    const loginRes = await apiCall('POST', '/api/auth/login', { username: 'skrana', code: '111111' });
    const token = loginRes.data.token;
    if (!token) { console.error('Login failed'); process.exit(1); }
    console.log('✅ Logged in as skrana');

    // Push REAL names from BR document
    const updateRes = await apiCall('POST', '/api/company/update-profile', {
        companyNameEn:      'SK RANA FACTORY OUTLET IMPORT & EXPORT CO., LTD.',
        companyNameKh:      'អេសខេ រាំណា ហ្វេកធើរី អៅឡេត អ៊ុមផត & អិចផត ឯ.ក',
        registrationNumber: '1000194124',
        incorporationDate:  '19-September-2022',
        companyType:        'Private Limited Liability Company',
        businessActivity:   '46413 - Wholesale of clothing and accessories',
        contactEmail:       'sktokadesrana@gmail.com',
        contactPhone:       '+855 92 282 310',
        director:           'SHEIKH TOKADES',
        majorityNationality: 'Foreigners',
        directors: [{
            nameKh: '',
            nameEn: 'SHEIKH TOKADES',
            address: 'Peroli, Kalia, Narail, Bangladesh',
            isChairman: true
        }],
        extractedData: {
            nameEn:           'SK RANA FACTORY OUTLET IMPORT & EXPORT CO., LTD.',
            name:             'អេសខេ រាំណា ហ្វេកធើរី អៅឡេត អ៊ុមផត & អិចផត ឯ.ក',
            regNumber:        '1000194124',
            incorporationDate:'19-September-2022',
            companyStatus:    'Registered',
            email:            'sktokadesrana@gmail.com',
            phone:            '+855 92 282 310',
            directorNameEn:   'SHEIKH TOKADES',
            businessActivity: '46413 - Wholesale of clothing and accessories'
        }
    }, token);

    if (updateRes.status === 200) {
        console.log('\n✅ SKRANA profile updated with REAL BR names!');
        console.log('  EN:', updateRes.data.profile?.companyNameEn);
        console.log('  KH:', updateRes.data.profile?.companyNameKh);
    } else {
        console.error('❌ Failed:', updateRes.data);
    }

    // Verify GL
    const gl = await apiCall('GET', '/api/company/ledger', null, token);
    console.log('\n✅ GL now returns:');
    console.log('  companyNameEn:', gl.data?.companyNameEn);
    console.log('  companyNameKh:', gl.data?.companyNameKh);
    console.log('\n🏁 Done.\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
