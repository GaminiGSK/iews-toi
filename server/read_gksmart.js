const https = require('https');
const BASE = 'iews-toi-588941282431.asia-southeast1.run.app';

function api(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const req = https.request({
            hostname: BASE, path, method,
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
        }, res => { let r = ''; res.on('data', c => r += c); res.on('end', () => resolve({ s: res.statusCode, b: JSON.parse(r) })); });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    const { b: lb } = await api('POST', '/api/auth/login', { username: 'GKSMART', code: '666666' });
    const token = lb.token;
    console.log('Logged in');

    const { b } = await api('GET', '/api/company/profile', null, token);
    const p = b.profile || b;

    console.log('\n=== GKSMART BR Profile ===');
    console.log('companyNameEn:', p.companyNameEn);
    console.log('companyNameKh:', p.companyNameKh);
    console.log('companyType  :', p.companyType);
    console.log('director     :', p.director);
    console.log('shareholder  :', p.shareholder);
    console.log('shareholders :', JSON.stringify(p.shareholders, null, 2));
    console.log('directors    :', JSON.stringify(p.directors, null, 2));
    console.log('businessActivities:', JSON.stringify(p.businessActivities, null, 2));
    console.log('registrationType:', p.registrationType);
    console.log('vatTin       :', p.vatTin);
}
run().catch(e => console.error(e.message));
