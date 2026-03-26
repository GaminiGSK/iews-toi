const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function go() {
    const t = (await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 })).data.token;
    const H = { Authorization: 'Bearer ' + t };

    for (const yr of ['2024', '2025']) {
        const af = await axios.get(BASE + '/api/company/toi/autofill?year=' + yr, { headers: H, timeout: 60000 });
        const fd = af.data.formData || {};
        console.log('\n=== YEAR', yr, '===');
        console.log('fs_revenue:', fd.fs_revenue, '| fs_gross_profit:', fd.fs_gross_profit);
        console.log('B0_n:', fd.B0_n, '| B3_n:', fd.B3_n, '| B22_n:', fd.B22_n, '| B42_n:', fd.B42_n, '| B48_n:', fd.B48_n);
        console.log('A0_n:', fd.A0_n, '| A28_n:', fd.A28_n, '| A30_n:', fd.A30_n, '| A36_n:', fd.A36_n);
        console.log('sources:', JSON.stringify(af.data.sources));
    }
}

go().catch(e => console.error(e.response?.data || e.message));
