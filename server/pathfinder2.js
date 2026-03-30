/**
 * pathfinder2.js — Deep scan across ALL admins
 * Checks what admin2 controls, and scans for users with BR/transaction data
 * that aren't visible to anyone.
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

async function main() {
    console.log('\n🔍 PATHFINDER 2 — Deep Cross-Admin Unit Scan\n');

    // Login as superadmin
    const superData = await login('Admin', '999999');
    const superToken = superData.token;
    console.log('✅ Superadmin logged in\n');

    // Get ALL admins
    const adminsRes = await apiCall('GET', '/api/auth/admins', null, superToken);
    const admins = Array.isArray(adminsRes.data) ? adminsRes.data : [];
    console.log(`Found ${admins.length} admin accounts:`);
    admins.forEach(a => console.log(`  - ${a.username} (${a._id})`));

    // For each admin, list their units
    console.log('\n─── Units per Admin ───────────────────────────');
    const allAccountedUnits = [];
    for (const admin of admins) {
        const unitsRes = await apiCall('GET', `/api/auth/admins/${admin._id}/units`, null, superToken);
        const units = Array.isArray(unitsRes.data) ? unitsRes.data : [];
        console.log(`\n  [${admin.username}] — ${units.length} units:`);
        units.forEach(u => {
            allAccountedUnits.push(u.username);
            console.log(`    • ${u.username} | role: ${u.role} | code: ${u.loginCode}`);
        });
    }

    // Check unassigned
    const unassignedRes = await apiCall('GET', '/api/auth/unassigned-units', null, superToken);
    const unassigned = Array.isArray(unassignedRes.data) ? unassignedRes.data : [];
    console.log(`\n─── Unassigned / Ghost Units ─────────────────`);
    if (unassigned.length === 0) {
        console.log('  ✅ None');
    } else {
        console.log(`  ❌ Found ${unassigned.length} ghost unit(s):`);
        unassigned.forEach(u => console.log(`    ❌ ${u.username} | role: ${u.role} | code: ${u.loginCode}`));
    }

    // Try logging in as admin2 to see what they see
    console.log('\n─── admin2 View ──────────────────────────────');
    try {
        const admin2Data = await login('admin2', '222222');
        const admin2Token = admin2Data.token;
        const admin2UnitsRes = await apiCall('GET', '/api/auth/users', null, admin2Token);
        const admin2Units = Array.isArray(admin2UnitsRes.data) ? admin2UnitsRes.data : [];
        console.log(`  admin2 can see ${admin2Units.length} units:`);
        admin2Units.forEach(u => console.log(`    • ${u.username} | role: ${u.role}`));
    } catch(e) {
        console.log(`  ❌ Cannot login as admin2: ${e.message}`);
    }

    // Probe: check which known unit names have transaction data
    console.log('\n─── Probing units with bank data ─────────────');
    const KNOWN_UNITS = ['GKSMART', 'TEXLINK', 'RSW', 'COCO', 'ARAKAN', 'CHANG ZHENG', 'IQBL', 'skrana', 'admin1', 'admin2'];
    for (const unitName of KNOWN_UNITS) {
        try {
            // Try login as unit with code 111111
            const code = unitName === 'GKSMART' ? '666666' : 
                         unitName === 'admin1' ? '111111' :
                         unitName === 'admin2' ? '222222' : '111111';
            const unitData = await login(unitName, code);
            const unitToken = unitData.token;
            const txRes = await apiCall('GET', '/api/company/transactions', null, unitToken);
            const txCount = Array.isArray(txRes.data?.transactions) ? txRes.data.transactions.length : 
                           (txRes.data?.message ? `Error: ${txRes.data.message}` : txRes.status);
            console.log(`  ${unitName}: ${txCount} transactions (role: ${unitData.user?.role})`);
        } catch(e) {
            console.log(`  ${unitName}: cannot login — ${e.message}`);
        }
    }

    console.log('\n🏁 Pathfinder 2 complete.\n');
}

main().catch(err => {
    console.error('Pathfinder Error:', err.message);
    process.exit(1);
});
