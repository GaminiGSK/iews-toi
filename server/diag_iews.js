const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function check() {
    console.log('=== IEWS-TOI DIAGNOSTIC ===');
    const login = await axios.post(BASE + '/api/auth/login', { username: 'arakan', code: '111111' });
    const token = login.data.token;
    const H = { Authorization: 'Bearer ' + token };

    // 1. Account codes
    const cr = await axios.get(BASE + '/api/company/codes', { headers: H });
    const codes = cr.data.codes || [];
    const withToi = codes.filter(c => c.toiCode);
    console.log('\n[ACCOUNT CODES] Total:', codes.length, '| With toiCode:', withToi.length);

    // 2. Company profile - raw
    const pr = await axios.get(BASE + '/api/company/profile', { headers: H });
    const raw = pr.data;
    // print full profile keys to see structure
    console.log('\n[PROFILE RAW KEYS]:', Object.keys(raw).join(', '));
    const p = raw.profile || raw;
    console.log('[PROFILE] vatTin:', p.vatTin);
    console.log('[PROFILE] companyNameEn:', p.companyNameEn);
    console.log('[PROFILE] companyNameKh:', p.companyNameKh);
    console.log('[PROFILE] director:', p.director);
    console.log('[PROFILE] address:', p.address);
    console.log('[PROFILE] organizedProfile present:', !!p.organizedProfile);
    if (p.organizedProfile) {
        console.log('[PROFILE] organizedProfile first 300 chars:', p.organizedProfile.substring(0, 300));
    }
    const extRaw = p.extractedData;
    if (extRaw && typeof extRaw === 'object') {
        const keys = Object.keys(extRaw);
        console.log('[PROFILE] extractedData keys (', keys.length, '):', keys.join(', '));
    } else {
        console.log('[PROFILE] extractedData:', extRaw);
    }

    // 3. Autofill
    const af = await axios.get(BASE + '/api/company/toi/autofill?year=2025', { headers: H });
    const fd = af.data.formData || {};
    console.log('\n[AUTOFILL 2025]');
    console.log('  tin:', fd.tin, '| name:', fd.name, '| director:', fd.directorName);
    console.log('  legalForm:', fd.legalForm, '| complianceStatus:', fd.taxComplianceStatus);
    console.log('  address1:', fd.address1);
    console.log('  A0_n:', fd.A0_n, '| A28_n:', fd.A28_n, '| A30_n:', fd.A30_n);
    console.log('  fs_revenue:', fd.fs_revenue, '| fs_gross_profit:', fd.fs_gross_profit);
    const nonEmpty = Object.fromEntries(Object.entries(fd).filter(([k,v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)));
    console.log('  Non-empty fields:', Object.keys(nonEmpty).length);
    console.log('  SOURCES:', JSON.stringify(af.data.sources));
}

check().catch(e => {
    console.error('ERROR:', e.response?.status, JSON.stringify(e.response?.data) || e.message);
    if (e.stack) console.error(e.stack.split('\n').slice(0,5).join('\n'));
});
