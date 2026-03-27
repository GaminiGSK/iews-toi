require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

async function checkModules() {
    await mongoose.connect(process.env.MONGODB_URI);
    const SalaryModule = require('./server/models/SalaryModule');
    const AssetModule = require('./server/models/AssetModule');
    
    const salary = await SalaryModule.findOne({ companyCode: 'GK_SMART_AI' });
    const assets = await AssetModule.findOne({ companyCode: 'GK_SMART_AI' });
    
    console.log("== SALARY ==");
    let tSal = 0;
    if (salary) {
        if (salary.shareholderEmployees) {
            salary.shareholderEmployees.forEach(e => tSal += parseFloat(e.annualSalary || 0));
        }
        if (salary.nonShareholderEmployees) {
            salary.nonShareholderEmployees.forEach(e => tSal += parseFloat(e.annualSalary || 0));
        }
    }
    console.log("Total Salary module:", tSal);
    
    console.log("== ASSETS ==");
    let tDep = 0;
    if (assets) {
        assets.assets.forEach(a => {
            const rates = { Building: 5, Furniture: 10, Computer: 25, Vehicle: 20, Other: 20 };
            const r = rates[a.category] || 10;
            const b = (parseFloat(a.cost)||0) + (parseFloat(a.additions)||0) - (parseFloat(a.disposals)||0);
            tDep += (b * r / 100);
        });
    }
    console.log("Total Asset Dep module:", tDep);
    
    process.exit(0);
}
checkModules();
