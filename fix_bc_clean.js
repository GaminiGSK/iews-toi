const fs = require('fs');
const path = 'server/routes/company.js';
let content = fs.readFileSync(path, 'utf8');

// Find the broken block start and end using unique markers
const blockStart = content.indexOf('            // \u2500\u2500 PAGES 5-6: Income Statement B-rows (B0-B48)');
const blockEnd   = content.indexOf('\n            // \u2500\u2500 PAGE 10-11: Tax Adjustments');

if (blockStart < 0 || blockEnd < 0) {
    // Fallback: find by the old merged comment line
    const alt = content.indexOf("// ── PAGE 10-11: Tax Adjustments ────────────────────────────────           // C2 = Purchases");
    const altStart = content.lastIndexOf('            // ── PAGES 5-6:', alt);
    console.log('Alt search: blockStart=', altStart, 'blockEnd includes alt pattern at', alt);
    if (alt >= 0) {
        // find end of the garbage block
        const garbageEnd = content.indexOf("\n            // Non-deductible items", alt) ;
        console.log('garbage end at', garbageEnd);
        const newBlock = `
            // ── PAGES 5-6: Income Statement B-rows (B0-B48) ──────────────────
            ...(() => {
                const b = {};
                b['B3_n']  = fmt(revenue);
                b['B0_n']  = fmt(revenue);
                b['B6_n']  = fmt(costOfSales);
                b['B7_n']  = fmt(Math.max(0, revenue - costOfSales));
                b['B23_n'] = fmt(salaryExpGL || totalSalary);
                b['B25_n'] = fmt(travelGL);
                b['B27_n'] = fmt(rentExpGL);
                b['B30_n'] = fmt(marketingGL);
                b['B36_n'] = fmt(depExpGL || totalDep);
                b['B41_n'] = fmt(otherExpGL + bankChargesGL);
                const totalOpEx2 = costOfSales + (salaryExpGL || totalSalary) + travelGL + rentExpGL + marketingGL + (depExpGL || totalDep) + bankChargesGL + otherExpGL;
                b['B22_n'] = fmt(totalOpEx2);
                const gpValue = revenue - costOfSales - (salaryExpGL || totalSalary) - travelGL - rentExpGL - marketingGL - (depExpGL || totalDep) - bankChargesGL - otherExpGL;
                b['B42_n'] = fmt(gpValue);
                b['B43_n'] = fmt(interestExpGL);
                const pbt  = gpValue - interestExpGL;
                b['B46_n'] = fmt(pbt);
                b['B47_n'] = fmt(Math.max(0, pbt * 0.20));
                b['B48_n'] = fmt(pbt - Math.max(0, pbt * 0.20));
                return b;
            })(),

            // ── PAGE 7: Costs of Products Sold C-rows (C1-C20) ──────────────
            ...(() => {
                const c = {};
                let openingStockC = 0;
                let closingStockC = 0;
                for (const code of codes) {
                    const num = parseInt(code.code) || 0;
                    if (num >= 52031 && num <= 52042) {
                        const prior = Math.max(0, (code.priorYearDr || 0) - (code.priorYearCr || 0));
                        openingStockC += prior;
                        const tc = code.toiCode;
                        const yearNet = tc && glMap[tc] ? glMap[tc].dr - glMap[tc].cr : 0;
                        closingStockC += Math.max(0, prior + yearNet);
                    }
                }
                const purchasesC = costOfSales || 0;
                c['C1_n']  = fmt(openingStockC);
                c['C2_n']  = fmt(purchasesC);
                c['C4_n']  = fmt(openingStockC + purchasesC);
                c['C5_n']  = fmt(closingStockC);
                const matUsed = Math.max(0, openingStockC + purchasesC - closingStockC);
                c['C6_n']  = fmt(matUsed || costOfSales);
                c['C8_n']  = fmt(salaryExpGL || totalSalary);
                c['C12_n'] = fmt(depExpGL || totalDep);
                const opCosts = (salaryExpGL || totalSalary) + (depExpGL || totalDep);
                c['C7_n']  = fmt(opCosts);
                c['C17_n'] = fmt((matUsed || costOfSales) + opCosts);
                c['C20_n'] = fmt(costOfSales || (matUsed + opCosts));
                return c;
            })(),

`;
        if (altStart >= 0 && garbageEnd >= 0) {
            content = content.substring(0, altStart) + newBlock + content.substring(garbageEnd);
            fs.writeFileSync(path, content, 'utf8');
            console.log('Fixed using alt method!');
        } else {
            console.error('Could not find boundaries via alt method');
        }
    } else {
        console.error('Cannot find block. blockStart:', blockStart, 'blockEnd:', blockEnd);
    }
    process.exit(0);
}

console.log('blockStart:', blockStart, 'blockEnd:', blockEnd);
const newBlock = `            // ── PAGES 5-6: Income Statement B-rows (B0-B48) ──────────────────
            ...(() => {
                const b = {};
                b['B3_n']  = fmt(revenue);
                b['B0_n']  = fmt(revenue);
                b['B6_n']  = fmt(costOfSales);
                b['B7_n']  = fmt(Math.max(0, revenue - costOfSales));
                b['B23_n'] = fmt(salaryExpGL || totalSalary);
                b['B25_n'] = fmt(travelGL);
                b['B27_n'] = fmt(rentExpGL);
                b['B30_n'] = fmt(marketingGL);
                b['B36_n'] = fmt(depExpGL || totalDep);
                b['B41_n'] = fmt(otherExpGL + bankChargesGL);
                const totalOpEx2 = costOfSales + (salaryExpGL || totalSalary) + travelGL + rentExpGL + marketingGL + (depExpGL || totalDep) + bankChargesGL + otherExpGL;
                b['B22_n'] = fmt(totalOpEx2);
                const gpValue = revenue - costOfSales - (salaryExpGL || totalSalary) - travelGL - rentExpGL - marketingGL - (depExpGL || totalDep) - bankChargesGL - otherExpGL;
                b['B42_n'] = fmt(gpValue);
                b['B43_n'] = fmt(interestExpGL);
                const pbt  = gpValue - interestExpGL;
                b['B46_n'] = fmt(pbt);
                b['B47_n'] = fmt(Math.max(0, pbt * 0.20));
                b['B48_n'] = fmt(pbt - Math.max(0, pbt * 0.20));
                return b;
            })(),

            // ── PAGE 7: Costs of Products Sold C-rows (C1-C20) ──────────────
            ...(() => {
                const c = {};
                let openingStockC = 0;
                let closingStockC = 0;
                for (const code of codes) {
                    const num = parseInt(code.code) || 0;
                    if (num >= 52031 && num <= 52042) {
                        const prior = Math.max(0, (code.priorYearDr || 0) - (code.priorYearCr || 0));
                        openingStockC += prior;
                        const tc = code.toiCode;
                        const yearNet = tc && glMap[tc] ? glMap[tc].dr - glMap[tc].cr : 0;
                        closingStockC += Math.max(0, prior + yearNet);
                    }
                }
                const purchasesC = costOfSales || 0;
                c['C1_n']  = fmt(openingStockC);
                c['C2_n']  = fmt(purchasesC);
                c['C4_n']  = fmt(openingStockC + purchasesC);
                c['C5_n']  = fmt(closingStockC);
                const matUsed = Math.max(0, openingStockC + purchasesC - closingStockC);
                c['C6_n']  = fmt(matUsed || costOfSales);
                c['C8_n']  = fmt(salaryExpGL || totalSalary);
                c['C12_n'] = fmt(depExpGL || totalDep);
                const opCosts = (salaryExpGL || totalSalary) + (depExpGL || totalDep);
                c['C7_n']  = fmt(opCosts);
                c['C17_n'] = fmt((matUsed || costOfSales) + opCosts);
                c['C20_n'] = fmt(costOfSales || (matUsed + opCosts));
                return c;
            })(),
`;

content = content.substring(0, blockStart) + newBlock + content.substring(blockEnd);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed! New length:', content.length);
