const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function audit() {
    const t = (await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 })).data.token;
    const H = { Authorization: 'Bearer ' + t };

    // 1. GL
    const codes = (await axios.get(BASE + '/api/company/codes', { headers: H, timeout: 30000 })).data.codes || [];
    const all = ((await axios.get(BASE + '/api/company/transactions?limit=500', { headers: H, timeout: 30000 })).data.transactions || []);
    const t24 = all.filter(x => new Date(x.date).getFullYear() === 2024);
    const t25 = all.filter(x => new Date(x.date).getFullYear() === 2025);
    const sum = (arr, fn) => arr.reduce((s, x) => s + (fn(x) || 0), 0);
    console.log('--- 1. GL SUMMARY ---');
    console.log('Account codes:', codes.length);
    console.log('Txns: all=' + all.length + ' 2024=' + t24.length + ' 2025=' + t25.length);
    console.log('2024: IN=' + sum(t24, x => x.amount > 0 ? x.amount : 0).toFixed(2) + ' OUT=' + sum(t24, x => x.amount < 0 ? Math.abs(x.amount) : 0).toFixed(2));
    console.log('2025: IN=' + sum(t25, x => x.amount > 0 ? x.amount : 0).toFixed(2) + ' OUT=' + sum(t25, x => x.amount < 0 ? Math.abs(x.amount) : 0).toFixed(2));

    // 2. Trial Balance
    console.log('\n--- 2. TRIAL BALANCE ---');
    for (const yr of ['2024', '2025']) {
        try {
            const r = await axios.get(BASE + '/api/company/trial-balance?year=' + yr, { headers: H, timeout: 30000 });
            const tb = r.data;
            const rows = tb.rows || tb.accounts || tb.ledger || [];
            const dr = tb.totalDebit || tb.totalDr || rows.reduce((s, r) => s + (r.debit || r.dr || 0), 0);
            const cr = tb.totalCredit || tb.totalCr || rows.reduce((s, r) => s + (r.credit || r.cr || 0), 0);
            const ok = Math.abs(dr - cr) < 1;
            console.log(yr + ': rows=' + rows.length + ' Dr=' + Number(dr).toFixed(2) + ' Cr=' + Number(cr).toFixed(2) + ' diff=' + (dr - cr).toFixed(2) + ' balanced=' + (ok ? 'YES' : 'NO'));
        } catch (e) {
            console.log(yr + ' TB error:', e.response?.status, e.response?.data?.message || e.message);
        }
    }

    // 3. FS
    console.log('\n--- 3. FINANCIAL STATEMENTS ---');
    for (const yr of ['2024', '2025']) {
        try {
            const r = await axios.get(BASE + '/api/company/financials-monthly?year=' + yr, { headers: H, timeout: 30000 });
            const fs = r.data;
            const months = fs.months || fs.monthlyData || [];
            const rev = fs.summary?.revenue ?? fs.totalRevenue ?? months.reduce((s, m) => s + (m.revenue || m.income || 0), 0);
            const exp = fs.summary?.expenses ?? fs.totalExpenses ?? months.reduce((s, m) => s + (m.expenses || 0), 0);
            const net = fs.summary?.netIncome ?? fs.netIncome ?? (rev - exp);
            const ast = fs.balanceSheet?.totalAssets ?? fs.totalAssets ?? 0;
            const eqt = fs.balanceSheet?.totalEquity ?? fs.totalEquity ?? 0;
            console.log(yr + ': Revenue=' + Number(rev).toFixed(2) + ' Expenses=' + Number(exp).toFixed(2) + ' Net=' + Number(net).toFixed(2));
            console.log('   TotalAssets=' + Number(ast).toFixed(2) + ' TotalEquity=' + Number(eqt).toFixed(2));
        } catch (e) {
            console.log(yr + ' FS error:', e.response?.status, e.response?.data?.message || e.message);
        }
    }

    // 4. TOI
    console.log('\n--- 4. TOI AUTOFILL ---');
    for (const yr of ['2024', '2025']) {
        const af = await axios.get(BASE + '/api/company/toi/autofill?year=' + yr, { headers: H, timeout: 60000 });
        const fd = af.data.formData || {};
        const src = af.data.sources || {};
        console.log('\n  [' + yr + '] Page 1 Identity:');
        console.log('    TIN=' + fd.tin + ' Name=' + fd.name + ' Legal=' + fd.legalForm + ' Branch=' + fd.branchOut);
        console.log('    Director=' + fd.directorName);
        console.log('  [' + yr + '] Income Statement:');
        console.log('    B0_n(Rev)=' + (fd.B0_n || 'EMPTY') + ' B3_n=' + (fd.B3_n || 'EMPTY') + ' B6_n(COGS)=' + (fd.B6_n || 'none'));
        console.log('    B22_n(GrossProfit)=' + (fd.B22_n || 'none') + ' B42_n(TotOpExp)=' + (fd.B42_n || 'none'));
        console.log('    B46_n(PBT)=' + (fd.B46_n || 'none') + ' B48_n(TotAllExp)=' + (fd.B48_n || 'none'));
        console.log('  [' + yr + '] fs_ fields:');
        console.log('    revenue=' + (fd.fs_revenue || 'EMPTY') + ' gross_profit=' + (fd.fs_gross_profit || 'none'));
        console.log('    salary=' + (fd.fs_salary_expense || 'none') + ' depreciation=' + (fd.fs_depreciation_expense || 'none'));
        console.log('  [' + yr + '] Balance Sheet:');
        console.log('    A0_n(TotAssets)=' + (fd.A0_n || 'EMPTY') + ' A1_n(NCA)=' + (fd.A1_n || 'none'));
        console.log('    A7_n(PPE)=' + (fd.A7_n || 'none') + ' A13_n(CurrAssets)=' + (fd.A13_n || 'none'));
        console.log('    A21_n(Cash)=' + (fd.A21_n || 'none') + ' A22_n(Bank)=' + (fd.A22_n || 'none'));
        console.log('    A28_n(Eq+Liab)=' + (fd.A28_n || 'EMPTY') + ' A30_n(ShareCap)=' + (fd.A30_n || 'EMPTY'));
        console.log('    A36_n(PLPeriod)=' + (fd.A36_n || 'none'));
        const a0v = parseFloat((fd.A0_n || '0').replace(/,/g, ''));
        const a28v = parseFloat((fd.A28_n || '0').replace(/,/g, ''));
        console.log('    BS BALANCED: ' + (fd.A0_n && fd.A28_n ? (Math.abs(a0v - a28v) < 1 ? 'YES A0=' + fd.A0_n + ' A28=' + fd.A28_n : 'NO diff=' + (a0v - a28v).toFixed(2)) : 'MISSING VALUES'));
        console.log('  [' + yr + '] Tax:');
        console.log('    E1_n(PBT)=' + (fd.E1_n || 'none') + ' E42_n(Taxable)=' + (fd.E42_n || 'none'));
        console.log('    E43_n(CIT20%)=' + (fd.E43_n || 'none') + ' E51_n(MinTax1%)=' + (fd.E51_n || 'none') + ' E52_n(TaxPay)=' + (fd.E52_n || 'none'));
        console.log('  [' + yr + '] Sources:', JSON.stringify(src));
        const ne = Object.entries(fd).filter(([k, v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
        console.log('  [' + yr + '] Non-empty fields:', ne.length);
    }
    console.log('\n--- AUDIT COMPLETE ---');
}

audit().catch(e => console.error('ERROR:', e.response?.data || e.message));
