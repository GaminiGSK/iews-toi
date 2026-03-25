const fs = require('fs');
let c = fs.readFileSync('server/routes/company.js', 'utf8');

// Fix G4-G8 and add G9-G13
// Find the G4_n line
const marker = 'G4_n:  fmt(Math.min(interestExpGL, revenue * 0.5)),';
const idx = c.indexOf(marker);
if (idx < 0) { console.log('G4 marker not found'); process.exit(1); }

// Find the end of the G8 block - just after G8_n:
const g8end = c.indexOf('G8_n:', idx) + 100;
const endMarket = c.indexOf('\n', g8end);

const oldBlock = c.substring(idx, endMarket + 1);
console.log('Old block:', JSON.stringify(oldBlock));

const newBlock = `            G4_n:  fmt(Math.max(0, grossProfit + interestExpGL)),  // Net non-interest income = E38+G2
            G5_n:  fmt(Math.max(0, (grossProfit + interestExpGL) * 0.5)),  // 50% cap
            G6_n:  '',
            G7_n:  fmt(Math.max(0, (grossProfit + interestExpGL) * 0.5)),  // max deductible
            G8_n:  fmt(Math.max(0, interestExpGL - Math.max(0, (grossProfit + interestExpGL) * 0.5))),
            // Page 12 B.1: Interest carryforward table keys
            G10_n: fmt(Math.max(0, interestExpGL - Math.max(0, (grossProfit + interestExpGL) * 0.5))),
            G11_n: fmt(Math.min(interestExpGL, Math.max(0, (grossProfit + interestExpGL) * 0.5))),
            G12_n: '',
            G13_n: fmt(Math.max(0, interestExpGL - Math.min(interestExpGL, Math.max(0, (grossProfit + interestExpGL) * 0.5)))),
`;

c = c.substring(0, idx) + newBlock + c.substring(endMarket + 1);
fs.writeFileSync('server/routes/company.js', c, 'utf8');

const {execSync} = require('child_process');
try { execSync('node --check server/routes/company.js'); console.log('✅ Syntax OK'); }
catch(e){ console.log('❌', e.message.substring(0,200)); }
