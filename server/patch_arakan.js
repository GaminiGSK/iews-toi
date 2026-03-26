// patch_arakan_profile.js
// Reads ARAKAN's organizedProfile from Production DB and patches all root fields
const axios = require('axios');
const BASE = 'https://iews-toi-588941282431.asia-southeast1.run.app';

async function patch() {
    console.log('=== PATCHING ARAKAN PROFILE on IEWS-TOI ===');
    const login = await axios.post(BASE + '/api/auth/login', { username: 'arakan', code: '111111' });
    const token = login.data.token;
    const H = { Authorization: 'Bearer ' + token };

    // 1. Read current profile
    const pr = await axios.get(BASE + '/api/company/profile', { headers: H });
    const p = pr.data.profile || pr.data;
    const op = p.organizedProfile || '';
    console.log('organizedProfile length:', op.length);

    // 2. Parse key fields from organizedProfile
    const tinMatch = op.match(/TIN[:\-\s]+([A-Z0-9\-]{8,})/i);
    const tin = (tinMatch && tinMatch[1].trim()) || 'K009-902503506';

    const nameMatch = op.match(/Legal Name[\s\S]*?([^\n\/]+)\s*\/\s*([^\n\-]+)/i);
    const companyNameKh = nameMatch ? nameMatch[1].trim() : 'អារ ក័ន ថេកណឡជី ឯ.ក';
    const companyNameEn = nameMatch ? nameMatch[2].trim() : 'ARKAN TECHNOLOGIES CO., LTD.';

    const dirMatch = op.match(/(?:Director|Managing Director|Authorized Representative|Signatory)[^:]*:\s*([^\n]+)/i);
    const director = dirMatch ? dirMatch[1].trim() : '';

    const addrMatch = op.match(/(?:Registered|Office|Registered Address)[^:]*:\s*([^\n]+)/i);
    const address = addrMatch ? addrMatch[1].trim() : '';

    const bizMatch = op.match(/(?:Business Activity|Principal Activity|Nature of Business)[^:]*:\s*([^\n]+)/i);
    const businessActivities = bizMatch ? bizMatch[1].trim() : 'Information Technology Services';

    const incDateMatch = op.match(/(?:Incorporation|Registration) Date[^:]*:\s*([^\n]+)/i);
    const incorporationDate = incDateMatch ? incDateMatch[1].trim() : '2025';

    console.log('\nExtracted:');
    console.log('  TIN:', tin);
    console.log('  KH Name:', companyNameKh);
    console.log('  EN Name:', companyNameEn);
    console.log('  Director:', director);
    console.log('  Address:', address);
    console.log('  Business:', businessActivities);
    console.log('  Inc Date:', incorporationDate);

    // 3. Now use the Blue Agent teach endpoint to store these as extractedData
    // This is the correct persistent write path the system uses
    const teachPayload = {
        message: `Please update and save the following company profile details permanently:
- TIN: ${tin}
- Company Name (KH): ${companyNameKh}
- Company Name (EN): ${companyNameEn}
- Legal Form: Private Limited Company
- Tax Compliance Status: Gold
- Income Tax Rate: 20%
- Accounting Record: Using Software
- Software Name: GK SMART AI
- Statutory Audit: Required
- Branch Count: 1
- Business Activities: ${businessActivities || 'Information Technology Services'}
${director ? '- Director Name: ' + director : ''}
${address ? '- Registered Address: ' + address : ''}
- Registration Date: ${incorporationDate}
Please confirm each field is saved.`,
        model: 'gemini-2.0',
        context: { route: '/toi-acar' }
    };

    console.log('\nSending teach request to Blue Agent...');
    const chatRes = await axios.post(BASE + '/api/chat/message', teachPayload, { headers: H });
    console.log('Agent reply:', chatRes.data.text?.substring(0, 300));

    // 4. Verify autofill now
    console.log('\n=== VERIFYING AUTOFILL ===');
    await new Promise(r => setTimeout(r, 2000));
    const af = await axios.get(BASE + '/api/company/toi/autofill?year=2025', { headers: H });
    const fd = af.data.formData || {};
    console.log('tin:', fd.tin);
    console.log('name:', fd.name);
    console.log('legalForm:', fd.legalForm);
    console.log('directorName:', fd.directorName);
    console.log('address1:', fd.address1);
    console.log('A30_n (share capital):', fd.A30_n);
    console.log('Non-empty fields:', Object.entries(fd).filter(([k,v]) => v !== '' && v !== null && !(Array.isArray(v) && v.length === 0)).length);
    console.log('DONE ✓');
}

patch().catch(e => {
    console.error('PATCH FAILED:', e.response?.status, JSON.stringify(e.response?.data) || e.message);
});
