const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function go() {
    const t = (await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 })).data.token;
    const H = { Authorization: 'Bearer ' + t };

    const cr = await axios.get(BASE + '/api/company/codes', { headers: H, timeout: 30000 });
    const codes = cr.data.codes || [];
    const codeMap = {};
    codes.forEach(c => { codeMap[c._id] = c; });

    const txns = await axios.get(BASE + '/api/company/transactions?limit=500', { headers: H, timeout: 30000 });
    const all = txns.data.transactions || txns.data || [];

    // Full breakdown by account
    const summary = {};
    for (const tx of all) {
        const ac = codeMap[tx.accountCode?._id || tx.accountCode];
        const key = (ac?.code || 'UNK') + ' [' + (ac?.toiCode || 'NOTOI') + ']';
        if (!summary[key]) summary[key] = { in: 0, out: 0, cnt: 0, name: ac?.name || '?' };
        summary[key].cnt++;
        if (tx.amount > 0) summary[key].in += tx.amount;
        else summary[key].out += Math.abs(tx.amount);
    }

    console.log('=== GK SMART GL TRANSACTIONS BY ACCOUNT (ALL TIME) ===');
    Object.entries(summary).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out)).forEach(([k, v]) => {
        console.log(` ${k}: IN=\$${v.in.toFixed(2)} OUT=\$${v.out.toFixed(2)} txns=${v.cnt}`);
    });

    // What should be revenue: 30100 transactions (income misclassified as capital)
    const rev30 = Object.entries(summary).find(([k]) => k.startsWith('30100'));
    if (rev30) {
        console.log('\n⚠️  Account 30100 (Share Capital) has', rev30[1].cnt, 'transactions totaling IN=$' + rev30[1].in.toFixed(2));
        console.log('   These may be REVENUE incorrectly coded as Share Capital!');
    }
}

go().catch(e => console.error(e.response?.data || e.message));
