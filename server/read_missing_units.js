/**
 * read_missing_units.js — reads CHANG ZHENG and IQBL BR documents
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: HOST, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
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

async function readUnit(username, code, adminToken) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`UNIT: ${username}`);
    console.log('═'.repeat(50));

    // Try unit login first
    const login = await post('/api/auth/login', { username, code });
    const token = login.token || adminToken;

    // Fetch profile
    const p = await get('/api/company/profile', token);

    console.log('companyNameEn :', p.companyNameEn || '(empty)');
    console.log('companyNameKh :', p.companyNameKh || '(empty)');
    console.log('documents count:', p.documents?.length || 0);
    console.log('organizedProfile:', p.organizedProfile ? `${p.organizedProfile.length} chars` : 'none');

    if (p.organizedProfile) {
        console.log('\n── Organized Profile (first 1200 chars) ──');
        console.log(p.organizedProfile.substring(0, 1200));
    }

    if (p.documents && p.documents.length > 0) {
        p.documents.forEach(doc => {
            console.log(`\n  ── ${doc.docType} | ${doc.status} ──`);
            if (doc.rawText) console.log(doc.rawText.substring(0, 1000));
            else console.log('  (no rawText)');
        });
    }
}

async function main() {
    const login = await post('/api/auth/login', { username: 'admin1', code: '111111' });
    const adminToken = login.token;
    console.log('✅ admin1 logged in');

    await readUnit('CHANG ZHENG', '111111', adminToken);
    await readUnit('IQBL', '111111', adminToken);
}

main().catch(e => console.error(e.message));
