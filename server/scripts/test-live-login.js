const https = require('https');

const data = JSON.stringify({ code: '666666' });

const options = {
    hostname: 'iews-toi-588941282431.asia-southeast1.run.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log(`Testing login at https://${options.hostname}${options.path} with code 666666...`);

const req = https.request(options, (res) => {
    let body = '';
    console.log('Status Code:', res.statusCode);

    res.on('data', (d) => {
        body += d;
    });

    res.on('end', () => {
        console.log('Response Body:', body);
        if (res.statusCode === 200) {
            const json = JSON.parse(body);
            if (json.token && json.user) {
                console.log('\n✅ SUCCESS: GK SMART Login (666666) is working on the live site.');
                process.exit(0);
            }
        }
        console.log('\n❌ FAILED: Login response was not successful.');
        process.exit(1);
    });
});

req.on('error', (error) => {
    console.error('Network Error:', error);
    process.exit(1);
});

req.write(data);
req.end();
