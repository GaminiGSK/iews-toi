const axios = require('axios');

async function fix() {
    try {
        console.log("Logging in as arakan...");
        const loginRes = await axios.post('https://bridge-brain-588941282431.asia-southeast1.run.app/api/auth/login', {
            username: 'arakan',
            code: '111111'
        });
        const token = loginRes.data.token;
        console.log("Got token.");

        console.log("Triggering save-registration-data...");
        const res = await axios.post('https://bridge-brain-588941282431.asia-southeast1.run.app/api/company/save-registration-data', {
            docType: 'moc_cert',
            filePath: '/tmp/patched-remote-mock.pdf',
            originalName: '1000484744_MOC_Certificate.pdf',
            extractedData: {
                companyNameEn: "ARKAN TECHNOLOGIES CO., LTD.",
                companyNameKh: "អារ កំន ថេកណឡជី ឯ.ក",
                vatTin: "K009-902503506",
                registrationNumber: "1000484744",
                incorporationDate: "28-April-2025",
                directorName: "ALLES TYRONE EDWARD",
                address: "180/37, Palliyawatha, Hendala, Wattala, Sri Lanka., Sri Lanka",
                businessActivity: "62010 Computer programming activities(2)"
            }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("SUCCESS:");
        console.log(JSON.stringify(res.data, null, 2));
        
    } catch (e) {
        console.error("ERROR:");
        console.error(e.response?.data || e.message);
    }
}
fix();
