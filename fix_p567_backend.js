const fs = require('fs');

const serverPath = 'server/routes/company.js';
let content = fs.readFileSync(serverPath, 'utf8');

// We need to add B-rows (Income Statement) and C-rows (COGS) to the formData.
// Insert AFTER the existing fs_* lines and BEFORE the PAGE 10-11 section.
// The fs_* block ends at: "fs_other_expense: fmt(otherExpGL),"

const oldFSBlock = `            // ── PAGE 8?: Financial Statements (IS) ──────────────────────
            fs_revenue:                               fmt(revenue),
            fs_cost_of_sales:                         fmt(costOfSales),
            fs_gross_profit:                          fmt(grossProfit),
            fs_salary_expense:                        fmt(salaryExpGL || totalSalary),
            fs_rental_expense:                        fmt(rentExpGL),
            fs_depreciation_expense:                  fmt(depExpGL || totalDep),
            fs_interest_expense:                      fmt(interestExpGL),
            fs_bank_charges:                          fmt(bankChargesGL),
            fs_marketing:                             fmt(marketingGL),
            fs_travel:                                fmt(travelGL),
            fs_other_expense:                         fmt(otherExpGL),`;

const newFSBlock = `            // ── PAGE 8?: Financial Statements (IS) ──────────────────────
            fs_revenue:                               fmt(revenue),
            fs_cost_of_sales:                         fmt(costOfSales),
            fs_gross_profit:                          fmt(grossProfit),
            fs_salary_expense:                        fmt(salaryExpGL || totalSalary),
            fs_rental_expense:                        fmt(rentExpGL),
            fs_depreciation_expense:                  fmt(depExpGL || totalDep),
            fs_interest_expense:                      fmt(interestExpGL),
            fs_bank_charges:                          fmt(bankChargesGL),
            fs_marketing:                             fmt(marketingGL),
            fs_travel:                                fmt(travelGL),
            fs_other_expense:                         fmt(otherExpGL),

            // ── PAGES 5-6: Income Statement B-rows (B0-B48) ──────────────────
            // B0 = Total Operating Revenue (B1+B2+B3)
            // B1 = Sales of products, B2 = Sales of goods, B3 = Services
            // B4 = COGS of production, B5 = COGS of non-production, B6 = Cost of services
            // B7 = Gross Profit = B0 - B4 - B5 - B6
            // B22 = Total Operating Expenses
            // B23 = Salary, B25 = Travel, B27 = Rental, B30 = Marketing, B36 = Depreciation
            // B43/B44 = Interest expenses, B46 = Profit Before Tax, B47 = Tax, B48 = Net Profit
            ...(() => {
                const b = {};
                // Revenue rows
                b['B3_n']  = fmt(revenue);     // Services revenue (GK SMART is a services company)
                b['B0_n']  = fmt(revenue);     // Total Revenue = B3
                b['B6_n']  = fmt(costOfSales); // Cost of services supplied
                b['B7_n']  = fmt(Math.max(0, revenue - costOfSales)); // Gross Profit
                // Expense rows
                b['B23_n'] = fmt(salaryExpGL || totalSalary); // Salary
                b['B25_n'] = fmt(travelGL);    // Travel & accommodation
                b['B27_n'] = fmt(rentExpGL);   // Rental
                b['B30_n'] = fmt(marketingGL); // Commission, advertising
                b['B36_n'] = fmt(depExpGL || totalDep); // Depreciation
                b['B41_n'] = fmt(otherExpGL);  // Other expenses
                // Sum operating expenses
                const totalOpEx = (salaryExpGL || totalSalary) + travelGL + rentExpGL + marketingGL + (depExpGL || totalDep) + bankChargesGL + otherExpGL + costOfSales;
                b['B22_n'] = fmt(totalOpEx);
                // Profit from operations
                const profitFromOps = revenue - (salaryExpGL || totalSalary) - travelGL - rentExpGL - marketingGL - (depExpGL || totalDep) - bankChargesGL - otherExpGL - costOfSales;
                b['B42_n'] = fmt(profitFromOps);
                // Interest expense
                b['B43_n'] = fmt(interestExpGL + bankChargesGL); // Interest + bank charges to residents
                // Profit before tax
                const profitBeforeTax = profitFromOps - interestExpGL - bankChargesGL;
                b['B46_n'] = fmt(profitBeforeTax);
                // Income tax (20%)
                const incomeTax = Math.max(0, profitBeforeTax * 0.20);
                b['B47_n'] = fmt(incomeTax);
                // Net profit after tax
                b['B48_n'] = fmt(profitBeforeTax - incomeTax);
                return b;
            })(),

            // ── PAGE 7: Costs of Products Sold C-rows (C1-C20) ──────────────
            // For a services company: most will be 0, C6=cost of services, C17=C6, C20=C17
            // For trading/production: map stock accounts from GL
            ...(() => {
                const c = {};
                // C1 = Opening stock of raw materials (from prior year)
                const openingStock = sumAcc([[52031,52042]], true);
                c['C1_n']  = fmt(openingStock);
                // C2 = Purchases during year from GL
                const purchases = glDr('D1') || 0;
                c['C2_n']  = fmt(purchases);
                // C4 = Total available = C1 + C2 + C3
                c['C4_n']  = fmt(openingStock + purchases);
                // C5 = Closing stock
                const closingStock = sumAcc([[52031,52042]], false);
                c['C5_n']  = fmt(closingStock);
                // C6 = Materials used = C4 - C5
                const materialsUsed = Math.max(0, openingStock + purchases - closingStock);
                c['C6_n']  = fmt(materialsUsed);
                // C8 = Production salaries
                c['C8_n']  = fmt(salaryExpGL || totalSalary);
                // C12 = Depreciation
                c['C12_n'] = fmt(depExpGL || totalDep);
                // C7 = Other production costs = C8 + C12
                const otherProdCosts = (salaryExpGL || totalSalary) + (depExpGL || totalDep);
                c['C7_n']  = fmt(otherProdCosts);
                // C17 = Total Production Costs = C6 + C7
                const totalProdCosts = materialsUsed + otherProdCosts;
                c['C17_n'] = fmt(totalProdCosts);
                // C20 = Cost of Products Sold = C17 + C18 - C19
                c['C20_n'] = fmt(costOfSales || totalProdCosts);
                return c;
            })(),`;

if (content.includes(oldFSBlock)) {
    content = content.replace(oldFSBlock, newFSBlock);
    console.log('✅ Backend B & C rows added!');
} else {
    // Try marker approach
    const startIdx = content.indexOf('            // \u2500\u2500 PAGE 8');
    const endIdx = content.indexOf('fs_other_expense:', startIdx) + ("            fs_other_expense:                         fmt(otherExpGL),".length);
    if (startIdx < 0 || endIdx < 0) {
        console.error('Cannot find target block! startIdx:', startIdx, 'endIdx:', endIdx);
        process.exit(1);
    }
    console.log('Using marker approach, replacing chars', startIdx, '-', endIdx);
    const oldBlock = content.substring(startIdx, endIdx);
    const fixedContent = content.substring(0, startIdx) + newFSBlock + content.substring(endIdx);
    content = fixedContent;
    console.log('✅ Backend B & C rows added (marker method)!');
}

fs.writeFileSync(serverPath, content, 'utf8');
console.log('Saved!');
