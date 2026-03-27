const https = require('https');
const BASE = 'iews-toi-588941282431.asia-southeast1.run.app';

const rq = (opts, body) => new Promise((res, rej) => {
  const r = https.request({ hostname: BASE, ...opts }, resp => {
    let d = ''; resp.on('data', x => d += x); resp.on('end', () => {
      try { res({ status: resp.statusCode, body: JSON.parse(d) }); }
      catch { res({ status: resp.statusCode, body: d }); }
    });
  });
  r.on('error', rej); if (body) r.write(body); r.end();
});

const paths = [
  '/api/bank-statements', '/api/bank-statements/list',
  '/api/transactions', '/api/transactions/list',
  '/api/company/financials', '/api/company/financial-statements',
  '/api/account-codes', '/api/company/account-codes',
  '/api/company/monthly', '/api/company/gl-summary',
  '/api/company/trial-balance',
];

async function main() {
  const bd = JSON.stringify({ username: 'GKSMART', code: '666666' });
  const lr = await rq({ path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bd) } }, bd);
  const tk = lr.body.token;
  console.log('Token:', tk ? 'OK' : 'FAIL');

  for (const p of paths) {
    const r = await rq({ path: p, headers: { Authorization: `Bearer ${tk}` } });
    const preview = typeof r.body === 'string' ? r.body.substring(0, 60) : JSON.stringify(r.body).substring(0, 80);
    console.log(String(r.status).padEnd(5), p.padEnd(40), preview);
  }
}
main().catch(console.error);
