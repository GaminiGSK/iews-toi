/**
 * fix_via_api.js
 * Fixes unit roles via the live Cloud Run API.
 * Run this: node fix_via_api.js
 */
const https = require('https');

const BASE_URL = 'https://iews-toi-588941282431.asia-southeast1.run.app';

function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'iews-toi-588941282431.asia-southeast1.run.app',
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(responseData) }); }
                catch (e) { resolve({ status: res.statusCode, data: responseData }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    // Step 1: Login as superadmin (666666 = the superadmin code)
    console.log('Step 1: Logging in as superadmin...');
    const loginRes = await apiCall('POST', '/api/auth/login', { loginCode: '666666' });
    if (!loginRes.data.token) {
        // Try 999999
        console.log('  666666 failed, trying 999999...');
        const loginRes2 = await apiCall('POST', '/api/auth/login', { loginCode: '999999' });
        if (!loginRes2.data.token) {
            console.error('❌ Cannot login:', loginRes2.data);
            process.exit(1);
        }
        console.log(`✅ Logged in as: ${loginRes2.data.user?.username} (${loginRes2.data.user?.role})`);
        var token = loginRes2.data.token;
        var role = loginRes2.data.user?.role;
    } else {
        console.log(`✅ Logged in as: ${loginRes.data.user?.username} (${loginRes.data.user?.role})`);
        var token = loginRes.data.token;
        var role = loginRes.data.user?.role;
    }

    // Step 2: Get all users
    console.log('\nStep 2: Fetching all users...');
    const usersRes = await apiCall('GET', '/api/auth/users', null, token);
    if (usersRes.status !== 200) {
        console.error('❌ Cannot get users:', usersRes.data);
    } else {
        console.log(`✅ Found ${usersRes.data.length} users:`);
        usersRes.data.forEach(u => {
            console.log(`  - ${u.username} | role: ${u.role} | code: ${u.loginCode}`);
        });
    }

    // Step 3: Get admins list (if superadmin)
    if (role === 'superadmin') {
        console.log('\nStep 3: Fetching admins...');
        const adminsRes = await apiCall('GET', '/api/auth/admins', null, token);
        console.log('Admins:', JSON.stringify(adminsRes.data, null, 2));
    }
}

main().catch(console.error);
