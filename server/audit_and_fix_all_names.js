/**
 * audit_and_fix_all_names.js
 * Reads every unit's BR rawText → extracts real EN + KH names → saves to profile.
 * Fixes GL, TB, FS all at once because they all read from CompanyProfile.
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function post(path, body, token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: HOST, path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(data) }
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

// Extract EN name from BR rawText
function extractEnName(rawText) {
    const patterns = [
        /Company Name \(in English\)[:\s]+([^\n]+)/i,
        /Name \(in English\)[:\s]+([^\n]+)/i,
        /Company Name \(English\)[:\s]+([^\n]+)/i,
    ];
    for (const p of patterns) {
        const m = rawText.match(p);
        if (m && m[1].trim().length > 3) return m[1].trim();
    }
    return null;
}

// Extract KH name from BR rawText
function extractKhName(rawText) {
    const patterns = [
        /Company Name \(in Khmer\)[:\s]*\n?([^\n]+)/i,
        /Company Name \(Khmer\)[:\s]*\n?([^\n]+)/i,
        /Name \(in Khmer\)[:\s]*\n?([^\n]+)/i,
    ];
    for (const p of patterns) {
        const m = rawText.match(p);
        if (m && m[1].trim().length > 1) return m[1].trim();
    }
    return null;
}

async function main() {
    // Login as admin1
    const login = await post('/api/auth/login', { username: 'admin1', code: '111111' }, '');
    const adminToken = login.token;
    if (!adminToken) { console.error('Admin login failed'); process.exit(1); }
    console.log('✅ Logged in as admin1\n');

    // Get all units
    const users = await get('/api/auth/users', adminToken);
    const units = users.filter(u => u.role === 'unit');
    console.log(`Found ${units.length} units to audit:\n`);

    const results = [];

    for (const unit of units) {
        const username = unit.username;
        process.stdout.write(`  Checking ${username}...`);

        try {
            // Fetch profile via admin route
            const profile = await get(`/api/company/admin/profile/${encodeURIComponent(username)}`, adminToken);

            const currentEn = profile.companyNameEn || '';
            const currentKh = profile.companyNameKh || '';

            // Scan all documents for BR rawText
            let foundEn = null, foundKh = null;
            const docs = profile.documents || [];
            for (const doc of docs) {
                if (doc.rawText && doc.rawText.length > 10) {
                    const en = extractEnName(doc.rawText);
                    const kh = extractKhName(doc.rawText);
                    if (en && !foundEn) foundEn = en;
                    if (kh && !foundKh) foundKh = kh;
                }
            }

            // Also check extractedData map
            const ed = profile.extractedData || {};
            const edEn = ed['company_name_en'] || ed['nameEn'] || ed['name_en'];
            const edKh = ed['company_name_kh'] || ed['nameKh'] || ed['name'];

            const bestEn = foundEn || edEn || currentEn;
            const bestKh = foundKh || edKh || currentKh;

            const needsFix = (bestEn !== currentEn) || (bestKh !== currentKh);

            results.push({ username, currentEn, currentKh, bestEn, bestKh, needsFix, docCount: docs.length });

            if (needsFix && bestEn) {
                // Login as this unit to update profile
                const uLogin = await post('/api/auth/login', { username, code: '111111' }, '');
                if (uLogin.token) {
                    await post('/api/company/update-profile', {
                        companyNameEn: bestEn,
                        companyNameKh: bestKh || currentKh,
                    }, uLogin.token);
                    process.stdout.write(` ✅ FIXED\n`);
                } else {
                    process.stdout.write(` ⚠️  can't login\n`);
                }
            } else {
                process.stdout.write(` ${bestEn ? '✓ ok' : '❌ no BR data'}\n`);
            }
        } catch(e) {
            process.stdout.write(` ❌ error: ${e.message}\n`);
        }
    }

    console.log('\n════════════════════════════════════════════════════════');
    console.log('AUDIT RESULTS');
    console.log('════════════════════════════════════════════════════════');
    for (const r of results) {
        console.log(`\n${r.username.toUpperCase()} (${r.docCount} docs)`);
        console.log(`  EN was: ${r.currentEn || '(empty)'}`);
        console.log(`  KH was: ${r.currentKh || '(empty)'}`);
        console.log(`  EN now: ${r.bestEn || '(no BR data found)'}`);
        console.log(`  KH now: ${r.bestKh || '(no BR data found)'}`);
        console.log(`  Fixed:  ${r.needsFix ? '✅ YES' : '— no change needed'}`);
    }

    console.log('\n🏁 All units audited.\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
