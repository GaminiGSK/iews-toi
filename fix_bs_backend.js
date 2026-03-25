const fs = require('fs');

// ─── 1. BACKEND FIX ────────────────────────────────────────────────────────
const serverPath = 'server/routes/company.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace the old bs_* block with the new A-row keyed block
const oldBSBlock = `            // ── PAGE 14-5: Balance Sheet ───────────────────────────────────────
            bs_cash:                 fmt(Math.max(0, cashGL)),
            bs_accounts_receivable:  fmt(Math.max(0, arGL)),
            bs_inventory:            fmt(Math.max(0, inventoryGL)),
            bs_ppe_gross:            fmt(totalAssetCost),
            bs_ppe_acc_dep:          fmt(totalDep),
            bs_ppe_nbv:              fmt(totalNBV),
            bs_total_assets:         fmt(totalAssetsGL > 0 ? totalAssetsGL : totalAssetCost + cashGL + arGL),
            bs_accounts_payable:     fmt(Math.max(0, apGL)),
            bs_loans:                fmt(Math.max(0, loanGL)),
            bs_equity:               fmt(Math.max(0, equityGL)),`;

const newBSBlock = `            // ── PAGE 3-4: Balance Sheet (A0-A52, N and N-1) ─────────────────
            // Helper: get current-year balance for an account-code number (net = CR-DR for liabilities/equity, DR-CR for assets)
            // Also keep legacy bs_* keys for backward compat
            bs_cash:                 fmt(Math.max(0, cashGL)),
            bs_accounts_receivable:  fmt(Math.max(0, arGL)),
            bs_inventory:            fmt(Math.max(0, inventoryGL)),
            bs_ppe_gross:            fmt(totalAssetCost),
            bs_ppe_acc_dep:          fmt(totalDep),
            bs_ppe_nbv:              fmt(totalNBV),
            bs_total_assets:         fmt(totalAssetsGL > 0 ? totalAssetsGL : totalAssetCost + cashGL + arGL),
            bs_accounts_payable:     fmt(Math.max(0, apGL)),
            bs_loans:                fmt(Math.max(0, loanGL)),
            bs_equity:               fmt(Math.max(0, equityGL)),
            ...(() => {
                // ── Build Balance Sheet A-row keys from AccountCode records ──
                // Each code has priorYearCr/priorYearDr (opening/N-1) and
                // current-year GL balances from txns/jes already computed in glMap via toiCode.
                // We map by account code NUMBER range (the actual account numbers 1xxxx-3xxxx).
                // For current-year balance, we use the TB-equivalent calculation:
                //   Assets (1xxxx): DR-CR net
                //   Liabilities (2xxxx): CR-DR net
                //   Equity (3xxxx): CR-DR net
                // For N-1 balance: priorYearCr - priorYearDr (stored on AccountCode)

                // Build code → { n, n1 } from codes (AccountCode records)
                // n = current year net balance from allTime txns/jes
                // n1 = prior year from priorYearCr/priorYearDr
                const codeBalN  = {};  // accountCode._id.toString() → current net
                const codeBalN1 = {};  // accountCode._id.toString() → prior net

                for (const c of codes) {
                    const codeNum = parseInt(c.code) || 0;
                    const isAsset = codeNum >= 10000 && codeNum < 20000;
                    const isLiab  = codeNum >= 20000 && codeNum < 30000;
                    const isEq    = codeNum >= 30000 && codeNum < 40000;
                    if (!isAsset && !isLiab && !isEq) continue;

                    // Prior year (N-1): from priorYear fields
                    const priorCr = c.priorYearCr || 0;
                    const priorDr = c.priorYearDr || 0;
                    const n1 = isAsset ? Math.max(0, priorDr - priorCr) : Math.max(0, priorCr - priorDr);
                    codeBalN1[c._id.toString()] = n1;
                    // N initialized to 0; will accumulate from allTime txns
                    codeBalN[c._id.toString()] = 0;
                }

                // Sum ALL-TIME txns for balance sheet accounts (to get closing bal)
                for (const tx of txnsAllTime) {
                    const acId = tx.accountCode?._id?.toString();
                    if (acId === undefined || codeBalN[acId] === undefined) continue;
                    const c = codes.find(c => c._id.toString() === acId);
                    const codeNum = parseInt(c?.code) || 0;
                    const isAsset = codeNum >= 10000 && codeNum < 20000;
                    const amt = Math.abs(tx.amount);
                    if (isAsset) {
                        // Asset: DR positive, CR negative
                        if (tx.amount > 0) codeBalN[acId] += amt;  // Credit = increase in asset (money in for bank = +balance)
                        else               codeBalN[acId] -= amt;
                    } else {
                        // Liability/Equity: CR positive, DR negative
                        if (tx.amount > 0) codeBalN[acId] += amt;  // Credit = increase in liab/eq
                        else               codeBalN[acId] -= amt;
                    }
                }
                for (const je of jesAllTime) {
                    for (const ln of (je.lines || [])) {
                        const acId = ln.accountCode?._id?.toString() || ln.accountCode?.toString();
                        if (acId === undefined || codeBalN[acId] === undefined) continue;
                        const c = codes.find(c => c._id.toString() === acId);
                        const codeNum = parseInt(c?.code) || 0;
                        const isAsset = codeNum >= 10000 && codeNum < 20000;
                        if (isAsset) {
                            codeBalN[acId] += (ln.debit || 0) - (ln.credit || 0);
                        } else {
                            codeBalN[acId] += (ln.credit || 0) - (ln.debit || 0);
                        }
                    }
                }

                // Helper: sum balance for a list of account code numbers or ranges
                const sumAcc = (codeNums, useN1 = false) => {
                    let total = 0;
                    for (const c of codes) {
                        const codeNum = parseInt(c.code) || 0;
                        const match = codeNums.some(cn => {
                            if (Array.isArray(cn)) return codeNum >= cn[0] && codeNum <= cn[1];
                            return codeNum === cn;
                        });
                        if (!match) continue;
                        const acId = c._id.toString();
                        total += useN1 ? (codeBalN1[acId] || 0) : Math.max(0, codeBalN[acId] || 0);
                    }
                    return total;
                };

                // Asset accounts by BS row
                const assetMap = {
                    A2:  [[17100, 17109]],           // Freehold land
                    A3:  [[17110, 17119]],            // Improvements of land
                    A4:  [[17200, 17209]],            // Freehold buildings
                    A5:  [[17210, 17219]],            // Buildings on leasehold
                    A6:  [[17220, 17229]],            // WIP
                    A7:  [[17230,17320]],             // Plant/Equip/Vehicles (net: cost - acc dep)
                    // A7 net uses special logic below
                    A8:  [],                          // Goodwill
                    A9:  [],                          // Formation expenses
                    A10: [],                          // Leasehold
                    A11: [],                          // Investments
                    A12: [],                          // Other non-current
                    A14: [[52031, 52042]],            // Raw materials/supplies
                    A15: [[15000, 15999]],            // Stock of goods
                    A16: [[16000, 16999]],            // Finished products
                    A17: [[12000, 12999]],            // WIP Products
                    A18: [11010],                     // Accounts receivable
                    A19: [14070],                     // Other receivables (staff advance)
                    A20: [13011, 13021, 13046],       // Prepaid expenses
                    A21: [10110],                     // Cash on hand
                    A22: [[10120, 10199]],            // Cash in banks (ABA and others)
                    A23: [13030],                     // Prepaid income tax
                    A24: [14060],                     // VAT credit
                    A25: [],                          // Other tax credits
                    A26: [],                          // Other current assets
                    A27: [],                          // FX gain/loss
                };

                // Liability accounts by BS row
                const liabMap = {
                    A38: [21100, 27500],              // Related party loans (non-current)
                    A39: [21300, 27100],              // Bank loans (non-current)
                    A40: [],                          // Provisions non-current
                    A41: [],                          // Other NCL
                    A43: [],                          // Bank overdraft
                    A44: [20100, 20400],              // Short-term borrowings
                    A45: [],                          // Payables to related parties
                    A46: [21500],                     // Other accounts payable / due to shareholders
                    A47: [],                          // Unearned revenues
                    A48: [],                          // Accrued expenses
                    A49: [],                          // Provisions current
                    A50: [],                          // Income tax payable
                    A51: [],                          // Other taxes payable
                    A52: [],                          // FX gain/loss liabilities
                };

                const bs = {};

                // ── Compute each asset row ──
                // A7 special: gross cost minus accumulated dep (all 17xxx accounts use code range)
                const ppeCostCodes = [[17230, 17320]];
                const grossPPE = sumAcc([[17230,17230],[17250,17250],[17270,17270],[17290,17290],[17310,17310]]);
                const accDepPPE= sumAcc([[17240,17240],[17260,17260],[17280,17280],[17300,17300],[17320,17320]]);
                const ppeCostN1  = sumAcc([[17230,17230],[17250,17250],[17290,17290]], true);
                const accDepN1   = sumAcc([[17240,17240],[17260,17260],[17300,17300]], true);
                const a7n  = Math.max(0, totalNBV);  // from asset register (more accurate)
                const a7n1 = Math.max(0, ppeCostN1 - accDepN1);

                for (const [row, codeList] of Object.entries(assetMap)) {
                    if (row === 'A7') continue; // handled above
                    bs[row + '_n']  = sumAcc(codeList, false);
                    bs[row + '_n1'] = sumAcc(codeList, true);
                }
                bs['A7_n']  = a7n;
                bs['A7_n1'] = a7n1;

                // ── Computed asset subtotals ──
                const a1n  = ['A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'].reduce((s,r) => s + (bs[r+'_n']||0), 0);
                const a1n1 = ['A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'].reduce((s,r) => s + (bs[r+'_n1']||0), 0);
                const a13n  = ['A14','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A27'].reduce((s,r) => s + (bs[r+'_n']||0), 0);
                const a13n1 = ['A14','A15','A16','A17','A18','A19','A20','A21','A22','A23','A24','A25','A26','A27'].reduce((s,r) => s + (bs[r+'_n1']||0), 0);
                bs['A1_n'] = a1n; bs['A1_n1'] = a1n1;
                bs['A13_n'] = a13n; bs['A13_n1'] = a13n1;
                bs['A0_n'] = a1n + a13n;
                bs['A0_n1'] = a1n1 + a13n1;

                // ── Equity rows ──
                bs['A30_n']  = shareCapitalFinal;
                bs['A30_n1'] = shareCapitalOpeningFinal;
                bs['A31_n']  = sumAcc([30200], false);
                bs['A31_n1'] = sumAcc([30200], true);
                // A32-A34 = reserve capital = 0 for now
                bs['A32_n'] = 0; bs['A32_n1'] = 0;
                bs['A33_n'] = 0; bs['A33_n1'] = 0;
                bs['A34_n'] = 0; bs['A34_n1'] = 0;
                // A35 = retained earnings (prior profit) = prior year P&L  
                // A36 = current year profit/loss (Revenue - Expenses)
                const netPL = revenue - (costOfSales + salaryExpGL + rentExpGL + depExpGL + interestExpGL + bankChargesGL + marketingGL + travelGL + otherExpGL);
                bs['A36_n']  = netPL;  bs['A36_n1'] = 0;
                bs['A35_n']  = 0;      bs['A35_n1'] = 0;
                const a29n  = bs['A30_n'] + bs['A31_n'] + bs['A32_n'] + bs['A33_n'] + bs['A34_n'] + (bs['A35_n']||0) + (bs['A36_n']||0);
                const a29n1 = bs['A30_n1'] + bs['A31_n1'];
                bs['A29_n'] = a29n; bs['A29_n1'] = a29n1;

                // ── Liability rows ──
                for (const [row, codeList] of Object.entries(liabMap)) {
                    bs[row + '_n']  = sumAcc(codeList, false);
                    bs[row + '_n1'] = sumAcc(codeList, true);
                }

                // ── Computed liability subtotals ──
                const a37n  = ['A38','A39','A40','A41'].reduce((s,r) => s + (bs[r+'_n']||0), 0);
                const a37n1 = ['A38','A39','A40','A41'].reduce((s,r) => s + (bs[r+'_n1']||0), 0);
                const a42n  = ['A43','A44','A45','A46','A47','A48','A49','A50','A51','A52'].reduce((s,r) => s + (bs[r+'_n']||0), 0);
                const a42n1 = ['A43','A44','A45','A46','A47','A48','A49','A50','A51','A52'].reduce((s,r) => s + (bs[r+'_n1']||0), 0);
                bs['A37_n'] = a37n; bs['A37_n1'] = a37n1;
                bs['A42_n'] = a42n; bs['A42_n1'] = a42n1;

                // ── Total Equity + Liabilities ──
                const a28n  = a29n + a37n + a42n;
                const a28n1 = a29n1 + a37n1 + a42n1;
                bs['A28_n'] = a28n; bs['A28_n1'] = a28n1;

                // ── Convert all to formatted strings, skip zeros ──
                const result = {};
                for (const [k, v] of Object.entries(bs)) {
                    const num = typeof v === 'number' ? v : 0;
                    result[k] = num !== 0 ? fmt(Math.abs(num)) : '';
                }
                return result;
            })(),`;

// Find and replace - use marker-based approach
const startIdx = serverContent.indexOf('            // \u2500\u2500 PAGE 14');
const endIdx = serverContent.indexOf('\n            bs_equity:', startIdx) + '            bs_equity:               fmt(Math.max(0, equityGL)),'.length + 1;

if (startIdx < 0 || endIdx < 0) {
    console.error('Could not find BS block! startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

// Get the actual old block
const oldBlock = serverContent.substring(startIdx, endIdx);
console.log('Old block found (first 80 chars):', oldBlock.substring(0, 80));

const fixedServer = serverContent.substring(0, startIdx) + newBSBlock + serverContent.substring(endIdx);
fs.writeFileSync(serverPath, fixedServer, 'utf8');
console.log('Backend written!');
