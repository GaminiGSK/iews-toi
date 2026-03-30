/**
 * read_skrana_br.js — reads SKRANA's actual BR raw text and extracted data
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function apiCall(method, path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST, path, method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
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
        req.end();
    });
}

async function main() {
    // Login as admin1 to access SKRANA profile
    const loginRes = await new Promise((resolve, reject) => {
        const body = JSON.stringify({ username: 'admin1', code: '111111' });
        const req = https.request({
            hostname: HOST, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => { let r = ''; res.on('data', c => r += c); res.on('end', () => resolve(JSON.parse(r))); });
        req.on('error', reject);
        req.write(body); req.end();
    });

    const token = loginRes.token;
    console.log('✅ Logged in as admin1\n');

    // Fetch SKRANA profile via admin route
    const res = await apiCall('GET', '/api/company/admin/profile/skrana', token);
    const p = res.data;

    console.log('════════════════════════════════════════');
    console.log('SKRANA — Company Profile Audit');
    console.log('════════════════════════════════════════');
    console.log('companyNameEn :', p.companyNameEn || '(empty)');
    console.log('companyNameKh :', p.companyNameKh || '(empty)');
    console.log('registrationNo:', p.registrationNumber || '(empty)');
    console.log('');

    console.log('extractedData map:');
    if (p.extractedData && typeof p.extractedData === 'object') {
        Object.entries(p.extractedData).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
    } else {
        console.log('  (none)');
    }

    console.log('\nUploaded BR Documents:');
    if (p.documents && p.documents.length > 0) {
        p.documents.forEach(doc => {
            console.log(`\n  ── ${doc.docType} | ${doc.status} ──`);
            if (doc.rawText) {
                // Print first 800 chars of raw text — this has the real name
                console.log('  RAW TEXT (first 1500 chars):');
                console.log(doc.rawText.substring(0, 1500));
            } else {
                console.log('  (no rawText extracted)');
            }
        });
    } else {
        console.log('  ❌ NO BR DOCUMENTS UPLOADED for SKRANA');
    }
}

main().catch(e => console.error(e.message));
