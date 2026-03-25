const fs = require('fs');
const path = 'server/routes/company.js';
let content = fs.readFileSync(path, 'utf8');

// Find the line with "// ── PAGE 12: Interest carry-forward"
const marker = '// \u2500\u2500 PAGE 12: Interest carry-forward';
const insertP = content.indexOf(marker);
if (insertP < 0) { console.log('Marker not found!'); process.exit(1); }

const newBlock = `            // \u2500\u2500 PAGE 8: COGS Non-Production (D-rows) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
            D1_n:  '',                    // Opening stock \u2013 user inputs
            D2_n:  fmt(costOfSales),      // Purchases during period (from GL)
            D3_n:  '',                    // Other purchase expenses \u2013 user inputs
            D7_n:  fmt(costOfSales),      // Total = D1+D2+D3
            D8_n:  '',                    // Closing stock \u2013 user inputs (from BS)
            D9_n:  fmt(costOfSales),      // COGS Sold = D7 - D8

            // \u2500\u2500 PAGES 9-10: Income Tax Calculation (E-rows) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
            ...(() => {
                const e1  = revenue - (salaryExpGL||totalSalary) - travelGL - rentExpGL - marketingGL - (depExpGL||totalDep) - bankChargesGL - otherExpGL - interestExpGL - costOfSales;
                const e18 = depExpGL || totalDep;   // add-back: accounting depreciation
                const e31 = depExpGL || totalDep;   // deduct: GDT depreciation (same method)
                const e36 = e1 + e18 - e31;         // profit after adjustments
                const e40 = e36;                    // no interest cap adjustment
                const e42 = Math.max(0, e40);       // taxable income (loss = 0)
                const e43 = e42 * 0.20;             // 20% CIT
                const e45 = e43;                    // total tax
                const e47 = e43;                    // after foreign tax credit (assume nil)
                const e50 = e47;                    // income tax liability
                const e53 = e50;                    // payable (proper books)
                const minTax = revenue * 0.01;      // 1% minimum tax
                const e51 = fmt(minTax);
                const e52 = fmt(Math.max(e50 > 0 ? e50 : 0, minTax));
                return {
                    E1_n:   fmt(e1),
                    E2_n:   fmt(depExpGL || totalDep),
                    E3_n:   '',
                    E4_n:   '',
                    E5_n:   '',
                    E6_n:   '',
                    E7_n:   '',
                    E8_n:   '',
                    E9_n:   '',
                    E10_n:  '',
                    E11_n:  '',
                    E12_n:  '',
                    E13_n:  '',
                    E14_n:  '',
                    E15_n:  '',
                    E16_n:  '',
                    E17_n:  '',
                    E18_n:  fmt(e18),
                    E19_n:  '',
                    E20_n:  '',
                    E21_n:  '',
                    E22_n:  '',
                    E23_n:  '',
                    E24_n:  '',
                    E25_n:  '',
                    E26_n:  fmt(depExpGL || totalDep),
                    E27_n:  '',
                    E28_n:  '',
                    E29_n:  '',
                    E30_n:  '',
                    E31_n:  fmt(e31),
                    E32_n:  '',
                    E33_n:  '',
                    E34_n:  '',
                    E35_n:  '',
                    E36_n:  fmt(e36),
                    E37_n:  '',
                    E38_n:  fmt(e36),
                    E39_n:  '',
                    E40_n:  fmt(e40),
                    E41_n:  '',
                    E42_n:  fmt(e42),
                    E43_n:  fmt(e43),
                    E44_n:  '',
                    E45_n:  fmt(e45),
                    E46_n:  '',
                    E47_n:  fmt(e47),
                    E48_n:  '',
                    E49_n:  '',
                    E50_n:  fmt(e50),
                    E51_n:  e51,
                    E52_n:  e52,
                    E53_n:  fmt(e53),
                    E54_n:  e52,
                    E55_n:  '',
                    E56_n:  '',
                    E57_n:  '',
                    E58_n:  '',
                    E59_n:  fmt(e53),
                };
            })(),

            // \u2500\u2500 PAGE 11-12: F-rows (Charitable) & G-rows (Interest cap) \u2500\u2500\u2500\u2500
            F1_n:  '',
            F2_n:  '',
            F3_n:  '',
            F4_n:  '',
            F5_n:  fmt(0),
            F6_n:  '',
            G1_n:  fmt(revenue),
            G2_n:  fmt(interestExpGL),
            G3_n:  fmt(Math.max(0, revenue * 0.5)),
            G4_n:  fmt(Math.min(interestExpGL, revenue * 0.5)),
            G5_n:  '',
            G6_n:  '',
            G7_n:  fmt(Math.max(0, interestExpGL - revenue * 0.5)),
            G8_n:  '',

`;

content = content.substring(0, insertP) + newBlock + content.substring(insertP);
fs.writeFileSync(path, content, 'utf8');
console.log('Inserted E/D/F/G rows');

// Verify syntax
const { execSync } = require('child_process');
try {
    execSync('node --check server/routes/company.js', { cwd: process.cwd() });
    console.log('✅ Syntax OK');
} catch(e) {
    console.log('❌ Syntax error:', e.message.substring(0,200));
}
