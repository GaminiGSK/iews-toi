/**
 * read_camesa_br.js — reads CAMESA full profile and rawText from the live API
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

async function main() {
    const login = await post('/api/auth/login', { username: 'admin1', code: '111111' });
    const token = login.token;
    console.log('✅ admin1 logged in\n');

    // Try fetching CAMESA profile
    const p = await get('/api/company/admin/profile/CAMESA', token);

    console.log('════════ CAMESA FULL PROFILE ════════');
    console.log('companyNameEn :', p.companyNameEn || '(empty)');
    console.log('companyNameKh :', p.companyNameKh || '(empty)');
    console.log('registrationNo:', p.registrationNumber || '(empty)');
    console.log('organizedProfile length:', p.organizedProfile?.length || 0);
    console.log('documents count:', p.documents?.length || 0);
    console.log('extractedData keys:', Object.keys(p.extractedData || {}));
    console.log('');

    // Print organizedProfile first 1000 chars — this has the real company name
    if (p.organizedProfile) {
        console.log('── Organized Profile (first 2000 chars) ──');
        console.log(p.organizedProfile.substring(0, 2000));
    }

    // Print each document rawText
    if (p.documents && p.documents.length > 0) {
        console.log(`\n── ${p.documents.length} Documents Found ──`);
        p.documents.forEach(doc => {
            console.log(`\n  DocType: ${doc.docType} | Status: ${doc.status}`);
            if (doc.rawText) {
                console.log('  RAW TEXT (first 1500):');
                console.log(doc.rawText.substring(0, 1500));
            } else {
                console.log('  (no rawText)');
            }
        });
    } else {
        console.log('❌ No documents in profile response — checking organizedProfile for name...');
    }
}

main().catch(e => console.error(e.message));
