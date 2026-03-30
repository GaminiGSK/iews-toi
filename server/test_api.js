const https = require('https');

const loginData = JSON.stringify({ username: 'admin1', code: 'admin123' });

const req = https.request('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const r = JSON.parse(data);
    if (!r.token) { console.error('Login failed', r); return; }
    
    https.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/auth/users', {
      headers: { 'Authorization': 'Bearer ' + r.token }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const users = JSON.parse(data2);
        console.log('UNITS RETURNED BY API:');
        console.log(users.map(u => u.username).join(', '));
      });
    });
  });
});

req.write(loginData);
req.end();
