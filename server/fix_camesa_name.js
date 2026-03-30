/**
 * fix_camesa_name.js — sets real company name from CAMESA's MOC.pdf
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: HOST, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        }, res => { let r = ''; res.on('data', c => r += c); res.on('end', () => { try { resolve(JSON.parse(r)); } catch { resolve(r); } }); });
        req.on('error', reject); req.write(data); req.end();
    });
}
function get(path, token) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: HOST, path, method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        }, res => { let r = ''; res.on('data', c => r += c); res.on('end', () => { try { resolve(JSON.parse(r)); } catch { resolve(r); } }); });
        req.on('error', reject); req.end();
    });
}

async function main() {
    // Login as CAMESA unit
    const login = await post('/api/auth/login', { username: 'CAMESA', code: '111111' });
    const token = login.token;
    if (!token) { console.error('CAMESA login failed'); process.exit(1); }
    console.log('✅ Logged in as CAMESA\n');

    // Push real names from MOC Certificate
    const res = await post('/api/company/update-profile', {
        companyNameEn:      'CAMESA',
        companyNameKh:      'កាមេសា',
        registrationNumber: '5000140411',
        oldRegistrationNumber: 'MOC-00013599',
        incorporationDate:  '25-March-2022',
        companyType:        'Sole Proprietorship',
        extractedData: {
            nameEn:           'CAMESA',
            name:             'កាមេសា',
            regNumber:        '5000140411',
            entityId:         'MOC-00013599',
            incorporationDate:'25-March-2022',
            companyStatus:    'Registered',
            companyType:      'Sole Proprietorship / សហគ្រាសឯកបុគ្គល'
        }
    }, token);

    if (res.profile) {
        console.log('✅ CAMESA profile updated!');
        console.log('  EN:', res.profile.companyNameEn);
        console.log('  KH:', res.profile.companyNameKh);
    } else {
        console.error('❌ Failed:', res);
    }

    // Verify GL
    const gl = await get('/api/company/ledger', token);
    console.log('\n✅ GL now shows:');
    console.log('  companyNameEn:', gl.companyNameEn);
    console.log('  companyNameKh:', gl.companyNameKh);
}

main().catch(e => console.error(e.message));
