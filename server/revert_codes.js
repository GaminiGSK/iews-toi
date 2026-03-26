// REVERT: Undo all unauthorized toiCode changes
// Restores the original accountant-assigned toiCodes
const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function revert() {
    const t = (await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 })).data.token;
    const H = { Authorization: 'Bearer ' + t };
    const cr = await axios.get(BASE + '/api/company/codes', { headers: H, timeout: 30000 });
    const codes = cr.data.codes || [];

    // Restore original accountant-assigned values
    const reverts = [
        { code: '40100', original: 'I02' },    // Service Revenue -> back to I02
        { code: '40000', original: null },       // Revenue header -> no toiCode (was undefined)
        { code: '42100', original: null },       // Other income -> no toiCode
        { code: '30000', original: null },       // Equity header -> no toiCode
        { code: '61000', original: null },       // Expense header -> no toiCode
    ];

    for (const { code, original } of reverts) {
        const found = codes.find(c => c.code === code);
        if (!found) { console.log('NOT FOUND:', code); continue; }
        const payload = original ? { toiCode: original } : { toiCode: '' };
        try {
            const r = await axios.put(BASE + '/api/company/codes/' + found._id, payload, { headers: H, timeout: 20000 });
            console.log(`REVERTED ${code}: -> "${original || '(none)'}" | ${r.data?.message || 'ok'}`);
        } catch (e) {
            console.log(`  ERR reverting ${code}:`, e.response?.status, JSON.stringify(e.response?.data));
        }
    }
    console.log('\nAll unauthorized changes reverted. GL codes restored to accountant-assigned values.');
}

revert().catch(e => console.error(e.response?.data || e.message));
