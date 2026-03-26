const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function go() {
    const t = (await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 })).data.token;
    const H = { Authorization: 'Bearer ' + t };

    // Get bank statements (transactions) for 2024 - these are the income entries
    const txns = await axios.get(BASE + '/api/company/transactions?limit=500', { headers: H, timeout: 30000 });
    const all = txns.data.transactions || txns.data || [];
    
    // Group by year and toiCode
    const byYear = { '2024': {}, '2025': {} };
    for (const tx of all) {
        const yr = new Date(tx.date).getFullYear().toString();
        if (!byYear[yr]) byYear[yr] = {};
        const tc = tx.accountCode?.toiCode || tx.accountCode?.code || 'NO_TOI';
        const acCode = tx.accountCode?.code || String(tx.accountCode);
        const key = acCode + '(' + tc + ')';
        if (!byYear[yr][key]) byYear[yr][key] = { cnt: 0, in: 0, out: 0 };
        byYear[yr][key].cnt++;
        if (tx.amount > 0) byYear[yr][key].in += tx.amount;
        else byYear[yr][key].out += Math.abs(tx.amount);
    }

    for (const yr of ['2024', '2025']) {
        console.log('\n=== YEAR', yr, 'TRANSACTIONS ===');
        const sorted = Object.entries(byYear[yr] || {}).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out));
        sorted.slice(0, 15).forEach(([key, v]) => {
            console.log(` ${key}: in=${v.in.toFixed(2)} out=${v.out.toFixed(2)} count=${v.cnt}`);
        });
    }

    // Summary totals for 2024
    const txns2024 = all.filter(tx => new Date(tx.date).getFullYear() === 2024);
    const totalIn2024 = txns2024.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
    const totalOut2024 = txns2024.filter(tx => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
    console.log('\n2024 Summary: Total IN=', totalIn2024.toFixed(2), ' Total OUT=', totalOut2024.toFixed(2), ' Count=', txns2024.length);
}

go().catch(e => console.error(e.response?.data || e.message));
