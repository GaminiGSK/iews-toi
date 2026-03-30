/**
 * pathfinder.js
 * ─────────────────────────────────────────────────────────────
 * Scans the LIVE Cloud Run API to:
 * 1. Login as admin1 and superadmin
 * 2. Find ALL users who have transaction/BR data (they exist, they uploaded)
 * 3. Cross-check which ones are INVISIBLE to admin1
 * 4. Call the fix endpoint to repair their role/createdBy
 * ─────────────────────────────────────────────────────────────
 */
const https = require('https');

const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: HOST,
            path,
            method,
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
    return res.data.token;
}

async function main() {
    console.log('\n🔍 PATHFINDER — Searching for MIA Units\n');

    // ── Step 1: Login as admin1 and superadmin ──────────────────
    console.log('▶ Logging in...');
    const admin1Token = await login('admin1', '111111');
    console.log('  ✅ admin1 logged in');

    const superToken = await login('Admin', '999999');
    console.log('  ✅ Admin (superadmin) logged in');

    // ── Step 2: What can admin1 currently SEE? ──────────────────
    console.log('\n▶ Fetching admin1 visible units...');
    const visibleRes = await apiCall('GET', '/api/auth/users', null, admin1Token);
    const visibleUnits = Array.isArray(visibleRes.data) ? visibleRes.data : [];
    const visibleNames = visibleUnits.map(u => u.username.toUpperCase());
    console.log(`  admin1 can see ${visibleUnits.length} units: ${visibleNames.join(', ') || 'NONE'}`);

    // ── Step 3: Who has bank transactions (they exist + uploaded data) ──
    console.log('\n▶ Discovering units with bank transaction data...');
    const txCompaniesRes = await apiCall('GET', '/api/auth/all-users-admin', null, superToken);
    
    // Try the admin endpoint to list all users
    const allUsersRes = await apiCall('GET', '/api/auth/users', null, superToken);
    const allAdmins = Array.isArray(allUsersRes.data) ? allUsersRes.data : [];
    console.log(`  Superadmin sees ${allAdmins.length} admins: ${allAdmins.map(u=>u.username).join(', ')}`);

    // ── Step 4: Get admin1's ID and list of units via /admins/:id/units ──
    const adminsRes = await apiCall('GET', '/api/auth/admins', null, superToken);
    const admins = Array.isArray(adminsRes.data) ? adminsRes.data : [];
    const admin1Obj = admins.find(a => a.username?.toLowerCase() === 'admin1');
    
    if (admin1Obj) {
        console.log(`\n  admin1 ID: ${admin1Obj._id}`);
        const admin1UnitsRes = await apiCall('GET', `/api/auth/admins/${admin1Obj._id}/units`, null, superToken);
        const admin1Units = Array.isArray(admin1UnitsRes.data) ? admin1UnitsRes.data : [];
        console.log(`  Units assigned to admin1 (from superadmin view): ${admin1Units.length}`);
        admin1Units.forEach(u => console.log(`    - ${u.username} | role: ${u.role} | code: ${u.loginCode}`));
        
        // ── Step 5: Fix — reassign ALL unassigned/missing units to admin1 ──
        console.log('\n▶ Running auto-repair: reassign unowned units to admin1...');
        const repairRes = await apiCall('POST', '/api/auth/reassign-units', {
            toAdminId: admin1Obj._id,
            assignUnowned: true
        }, superToken);
        console.log('  Repair result:', JSON.stringify(repairRes.data));
    } else {
        console.log('  ❌ admin1 not found in admins list!');
        console.log('  Admins found:', admins.map(a => `${a.username}(${a.role})`).join(', '));
    }

    // ── Step 6: Check unassigned units ──────────────────────────
    console.log('\n▶ Checking for unassigned units...');
    const unassignedRes = await apiCall('GET', '/api/auth/unassigned-units', null, superToken);
    const unassigned = Array.isArray(unassignedRes.data) ? unassignedRes.data : [];
    if (unassigned.length > 0) {
        console.log(`  Found ${unassigned.length} unassigned units:`);
        unassigned.forEach(u => console.log(`    ❌ ${u.username} | role: ${u.role}`));
    } else {
        console.log('  ✅ No unassigned units found');
    }

    // ── Step 7: Final check — what can admin1 see NOW? ──────────
    console.log('\n▶ Final check — refreshing admin1 visible units...');
    const finalRes = await apiCall('GET', '/api/auth/users', null, admin1Token);
    const finalUnits = Array.isArray(finalRes.data) ? finalRes.data : [];
    console.log(`  admin1 can now see ${finalUnits.length} units:`);
    finalUnits.forEach(u => console.log(`    ✅ ${u.username} | role: ${u.role} | code: ${u.loginCode}`));

    console.log('\n🏁 Pathfinder complete.\n');
}

main().catch(err => {
    console.error('Pathfinder Error:', err.message);
    process.exit(1);
});
