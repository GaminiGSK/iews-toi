const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function go() {
    const t = (await axios.post(BASE + '/api/auth/login', { username: 'gksmart', code: '666666' }, { timeout: 30000 })).data.token;
    const H = { Authorization: 'Bearer ' + t };

    // Get all account codes
    const cr = await axios.get(BASE + '/api/company/codes', { headers: H, timeout: 30000 });
    const codes = cr.data.codes || [];
    
    // The known ObjectIds from transactions
    const knownIds = [
        '69accc7868bdad71f5c1d747',  // main income account
        '6970edb2b37508ea419035e5',  // expenses
        '6970edb3b37508ea41903601',  // expenses
        '6970edb1b37508ea419035e1',  // expenses
        '6970edb1b37508ea419035df',  // expenses
        '6970edb3b37508ea419035fe',  // expenses
    ];
    
    console.log('Matching ObjectIds to account codes:');
    for (const id of knownIds) {
        const match = codes.find(c => c._id === id);
        if (match) {
            console.log(` ${id} -> code: ${match.code} toiCode: ${match.toiCode} name: ${match.name}`);
        } else {
            console.log(` ${id} -> NOT FOUND in codes list`);
        }
    }
    
    // How many codes total vs codes with matching IDs
    console.log('\nTotal codes:', codes.length);
    console.log('Sample code IDs:', codes.slice(0, 5).map(c => c._id + '=' + c.code).join(', '));
    
    // Also check: does account code list include the ABA bank account?
    const bankCodes = codes.filter(c => 
        (c.name || '').toLowerCase().includes('bank') ||
        (c.name || '').toLowerCase().includes('aba') ||
        (c.code || '').startsWith('10')
    );
    console.log('\nBank/cash codes:', bankCodes.map(c => c.code + '(' + c.toiCode + ')').join(', '));
    
    // And the ABA opening balance record
    const profile = await axios.get(BASE + '/api/company/profile', { headers: H, timeout: 30000 });
    const p = profile.data.profile || profile.data;
    console.log('abaOpeningBalance:', p.abaOpeningBalance);
}

go().catch(e => console.error(e.response?.data || e.message));
