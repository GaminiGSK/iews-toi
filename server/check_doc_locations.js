/**
 * check_doc_locations.js
 * Checks where CAMESA's 4 docs actually ended up in the DB.
 * Reads admin1, CAMESA, and checks Company Profile doc counts.
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function req(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: HOST, path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const r = https.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ _raw: raw.substring(0, 300) }); } });
        });
        r.on('error', reject);
        if (data) r.write(data);
        r.end();
    });
}

async function main() {
    const adminLogin = await req('POST', '/api/auth/login', { username: 'admin1', code: '111111' });
    const adminToken = adminLogin.token;
    const camesaLogin = await req('POST', '/api/auth/login', { username: 'CAMESA', code: '111111' });
    const camesaToken = camesaLogin.token;
    console.log('✅ Logged in\n');

    // Check CAMESA via unit token (most direct)
    const camesaDirect = await req('GET', '/api/company/profile', null, camesaToken);
    console.log('CAMESA (unit token):');
    console.log('  docs:', camesaDirect.documents?.length || 0);
    console.log('  organizedProfile:', camesaDirect.organizedProfile?.length || 0, 'chars');
    (camesaDirect.documents || []).forEach(d => {
        console.log(`    ↳ ${d.docType} | ${d.originalName} | rawText: ${d.rawText?.length || 0} chars`);
    });

    // Check admin1's own profile (maybe docs got saved there)
    console.log('\nadmin1 (own profile via unit profile route):');
    const adminProfile = await req('GET', '/api/company/profile', null, adminToken);
    console.log('  docs:', adminProfile.documents?.length || 0);
    (adminProfile.documents || []).forEach(d => {
        console.log(`    ↳ ${d.docType} | ${d.originalName} | rawText: ${d.rawText?.length || 0} chars`);
    });

    // Try fetching CAMESA admin route with rawText explicitly included
    const camesaAdmin = await req('GET', '/api/company/admin/profile/CAMESA', null, adminToken);
    console.log('\nCAMESA (admin route):');
    console.log('  docs:', camesaAdmin.documents?.length || 0);
    console.log('  organizedProfile:', camesaAdmin.organizedProfile?.length || 0, 'chars');
    (camesaAdmin.documents || []).forEach(d => {
        console.log(`    ↳ ${d.docType} | ${d.originalName} | rawText: ${d.rawText?.length || 0} chars`);
    });

    // Print the FULL organizedProfile to see what intelligence the AI extracted
    if (camesaAdmin.organizedProfile) {
        console.log('\n── CAMESA organizedProfile (full) ──');
        console.log(camesaAdmin.organizedProfile);
    }
}

main().catch(e => console.error(e.message));
