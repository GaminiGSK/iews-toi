const axios = require('axios');

async function testApi() {
    try {
        const res = await axios.get('https://iews-toi-588941282431.asia-southeast1.run.app/api/company/monthly-extra/TOI-2025?year=2025');
        const data = res.data;
        
        console.log("=== EQUITY ===");
        data.equity.forEach(e => {
            console.log(e.description, e.months);
        });
        
    } catch (e) {
        console.error("error:", e.message);
    }
}

testApi();
