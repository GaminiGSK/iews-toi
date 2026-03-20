const mongoose = require('mongoose');

async function getYearlyMoneyIn() {
    await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
    
    // Check TOI-2025
    let txTOI = await mongoose.connection.collection('transactions').find({ companyCode: 'TOI-2025' }).toArray();
    let toiMonthly = Array(12).fill(0);
    
    txTOI.forEach(t => {
        let d = new Date(t.date);
        let amount = parseFloat(t.amount || 0);
        if (d.getFullYear() === 2025 && amount > 0) {
            toiMonthly[d.getMonth()] += amount;
        }
    });

    // Check GK_SMART_AI
    let txGK = await mongoose.connection.collection('transactions').find({ companyCode: 'GK_SMART_AI' }).toArray();
    let gkMonthly = Array(12).fill(0);
    
    txGK.forEach(t => {
        let d = new Date(t.date);
        let amount = parseFloat(t.amount || 0);
        if (d.getFullYear() === 2025 && amount > 0) {
            gkMonthly[d.getMonth()] += amount;
        }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    console.log("=== MONEY IN FOR 2025 ===");
    console.log("Month | TOI-2025 | GK_SMART_AI");
    console.log("--------------------------------");
    for (let i = 0; i < 12; i++) {
        console.log(`${monthNames[i].padEnd(5)} | $${toiMonthly[i].toFixed(2).padEnd(8)} | $${gkMonthly[i].toFixed(2)}`);
    }

    process.exit(0);
}

getYearlyMoneyIn();
