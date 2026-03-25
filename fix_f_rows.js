const fs = require('fs');
let c = fs.readFileSync('server/routes/company.js', 'utf8');

// Find and replace F1_n through F6_n
const marker = 'F1_n: \'\', F2_n: \'\', F3_n: \'\', F4_n: \'\',\n            F5_n: \'0\',\n            F6_n: \'\',';
const idx = c.indexOf(marker);
if (idx < 0) { console.log('F-row marker not found'); process.exit(1); }

// Get end of current F block
const endIdx = c.indexOf(marker) + marker.length;

const newFBlock = `...(() => {
                // F-row Charitable Contribution Calculation
                const bOpEx  = costOfSales + (salaryExpGL||totalSalary) + travelGL + rentExpGL + marketingGL + (depExpGL||totalDep) + bankChargesGL + otherExpGL;
                const b42f   = Math.max(0, grossProfit - (salaryExpGL||totalSalary) - travelGL - rentExpGL - marketingGL - (depExpGL||totalDep) - bankChargesGL - otherExpGL);
                const b46f   = b42f - interestExpGL;
                const dep_f  = depExpGL || totalDep;
                const e36_f  = b46f; // E36 = profit after adjustments
                const f1     = e36_f;  // F1 = E36
                const f2     = 0;      // Charitable contributions (user inputs, default 0)
                const f3     = f1 + f2; // F3 = F1+F2
                const f4     = Math.max(0, f3 * 0.05); // F4 = 5% cap
                const f5     = Math.min(f2, f4); // F5 = whichever is lower
                const f6     = f2 - f5; // F6 = non-deductible portion
                const fmtT   = (n) => n === undefined || isNaN(n) ? '' : Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return { F1_n: fmtT(f1), F2_n: '', F3_n: fmtT(f3), F4_n: fmtT(f4), F5_n: fmtT(f5), F6_n: fmtT(f6) };
            })(),`;

c = c.substring(0, idx) + newFBlock + c.substring(endIdx);
fs.writeFileSync('server/routes/company.js', c, 'utf8');

const {execSync} = require('child_process');
try { execSync('node --check server/routes/company.js'); console.log('✅ Syntax OK'); }
catch(e){ console.log('❌', e.message.substring(0,400)); }
