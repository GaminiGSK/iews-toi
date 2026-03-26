// fix_revenue_codes.js
// Patches GK SMART revenue account codes to correct B-prefix TOI codes
// 40100 (Service Revenue) -> B3 (Net Revenue / Turnover)
// 40000 (Revenue header) -> B0
// 42100 (Other income) -> B4

const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function go() {
    const login = await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 });
    const token = login.data.token;
    const H = { Authorization: 'Bearer ' + token };

    // 1. Fetch all codes
    const cr = await axios.get(BASE + '/api/company/codes', { headers: H, timeout: 30000 });
    const codes = cr.data.codes || [];

    const targets = [
        { code: '40100', newToiCode: 'B3' },  // Service Revenue -> Net Revenue/Turnover
        { code: '40000', newToiCode: 'B0' },  // Revenue header -> Total Revenue
        { code: '42100', newToiCode: 'B4' },  // Other income -> Other Revenue
        { code: '30000', newToiCode: 'A30' }, // Equity/Capital range header
        { code: '61000', newToiCode: 'B42' }, // General expense header -> Other operating exp
    ];

    for (const { code, newToiCode } of targets) {
        const found = codes.find(c => c.code === code);
        if (!found) { console.log('NOT FOUND:', code); continue; }
        console.log(`Patching ${code} (currently ${found.toiCode}) -> ${newToiCode}`);
        try {
            const r = await axios.put(BASE + '/api/company/codes/' + found._id,
                { toiCode: newToiCode },
                { headers: H, timeout: 20000 }
            );
            console.log('  Result:', r.data?.message || r.data?.code || 'ok');
        } catch (e) {
            console.log('  ERR:', e.response?.status, JSON.stringify(e.response?.data));
        }
    }

    // 3. Verify autofill now has revenue
    console.log('\n=== VERIFYING AUTOFILL ===');
    await new Promise(r => setTimeout(r, 1000));
    const af = await axios.get(BASE + '/api/company/toi/autofill?year=2025', { headers: H, timeout: 60000 });
    const fd = af.data.formData || {};
    console.log('B0_n (Total Rev):', fd.B0_n);
    console.log('B3_n (Net Rev):', fd.B3_n);
    console.log('fs_revenue:', fd.fs_revenue);
    console.log('fs_gross_profit:', fd.fs_gross_profit);
    console.log('B23_n (Salary):', fd.B23_n);
    console.log('B48_n (Total Exp):', fd.B48_n);
}

go().catch(e => console.error('FATAL:', e.response?.data || e.message));
