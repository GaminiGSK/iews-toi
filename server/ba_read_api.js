/**
 * BA Auditor: Read company data via live API
 */
const https = require('https');

// Use the live Cloud Run API 
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

// First get a token by reading from local storage simulation
// We'll use the autofill endpoint which returns extracted company data
const url = `${BASE}/api/company/toi/autofill?year=2024`;

// Need auth token - get it from a known admin pattern
const token = process.env.API_TOKEN || '';

const options = {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

// Try without auth first to see what we get
https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const fd = json.formData || json;
            console.log('\n=== COMPANY DATA FROM LIVE API ===');
            console.log('companyNameEN :', fd.companyNameEN);
            console.log('companyNameKH :', fd.companyNameKH);  
            console.log('name          :', fd.name);
            console.log('enterpriseName:', fd.enterpriseName);
            console.log('legalForm     :', fd.legalForm);
            console.log('tin           :', fd.tin);
            console.log('directorName  :', fd.directorName);
        } catch(e) {
            console.log('Response status:', res.statusCode);
            console.log('Response (first 300):', data.substring(0, 300));
        }
    });
}).on('error', e => console.log('Error:', e.message));
