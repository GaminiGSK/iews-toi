const fs = require('fs');
const path = require('path');
const keyPath = path.resolve('server/config/service-account.json');
try {
    const key = JSON.parse(fs.readFileSync(keyPath));
    console.log('Service Account Email: ' + key.client_email);
} catch (e) {
    console.log('Could not read key');
}
