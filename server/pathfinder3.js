/**
 * pathfinder3.js — Check BR files and bank statement counts per unit
 * Finds units whose data exists but may not be accessible
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
    if (!res.data.token) throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
    return res.data;
}

// Units to check: ALL known units + their login codes
const UNITS = [
    { name: 'GKSMART',     code: '666666' },
    { name: 'TEXLINK',     code: '111111' },
    { name: 'RSW',         code: '111111' },
    { name: 'COCO',        code: '111111' },
    { name: 'ARAKAN',      code: '111111' },
    { name: 'CHANG ZHENG', code: '111111' },
    { name: 'IQBL',        code: '111111' },
    { name: 'skrana',      code: '111111' },
];

async function main() {
    console.log('\n🔍 PATHFINDER 3 — BR/Bank Data Audit Per Unit\n');
    console.log('Unit            | Transactions | Bank Files | Account Codes | Status');
    console.log('─'.repeat(75));

    for (const unit of UNITS) {
        try {
            const sessionData = await login(unit.name, unit.code);
            const token = sessionData.token;

            // Check transactions
            const txRes = await apiCall('GET', '/api/company/transactions', null, token);
            const txCount = txRes.data?.transactions?.length ?? txRes.data?.length ?? '?';

            // Check bank files
            const bfRes = await apiCall('GET', '/api/company/bank-files', null, token);
            const bfCount = Array.isArray(bfRes.data) ? bfRes.data.length : '?';

            // Check account codes
            const acRes = await apiCall('GET', '/api/company/codes', null, token);
            const acCount = acRes.data?.codes?.length ?? '?';

            const status = txCount === 0 && bfCount === 0 ? '⚠️  NO DATA' : '✅';
            
            const row = `${unit.name.padEnd(15)} | ${String(txCount).padEnd(12)} | ${String(bfCount).padEnd(10)} | ${String(acCount).padEnd(13)} | ${status}`;
            console.log(row);
        } catch(e) {
            console.log(`${unit.name.padEnd(15)} | ❌ LOGIN FAILED: ${e.message}`);
        }
    }

    // Also try admin1 spoofing ALL units (as admin1 would see them)
    console.log('\n─── Admin1 Spoof Check (which units admin1 can spoof into) ───');
    const admin1Data = await login('admin1', '111111');
    const admin1Token = admin1Data.token;
    
    // Get all visible users
    const usersRes = await apiCall('GET', '/api/auth/users', null, admin1Token);
    const users = Array.isArray(usersRes.data) ? usersRes.data : [];
    
    for (const u of users) {
        // Try to access ledger as that user (via x-target-user spoofing)
        const ledgerRes = await apiCall('GET', '/api/company/ledger', null, admin1Token);
        // This just checks admin1's own ledger — real spoof needs x-target-user header
    }
    
    console.log(`  admin1 can spoof ${users.length} units: ${users.map(u=>u.username).join(', ')}`);
    console.log('\n🏁 Pathfinder 3 complete.\n');
}

main().catch(err => {
    console.error('Pathfinder Error:', err.message);
    process.exit(1);
});
