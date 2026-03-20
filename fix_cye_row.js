const fs = require('fs');
const path = 'e:/Antigravity/TOI/client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the Current Year Earnings row to use cumulative
const oldStr = 'renderMonthRow("Current Year Earnings", mNetProfit,';
const newStr = 'renderMonthRow("Current Year Earnings", mNetProfitCumulative,';

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log('✅ Fixed: Current Year Earnings now uses mNetProfitCumulative');
} else {
    console.log('❌ String not found — checking for alternate quote style...');
    // Try with escaped quotes
    const alt = "renderMonthRow(\"Current Year Earnings\", mNetProfit,";
    if (content.includes(alt)) {
        content = content.replace(alt, "renderMonthRow(\"Current Year Earnings\", mNetProfitCumulative,");
        fs.writeFileSync(path, content, 'utf8');
        console.log('✅ Fixed with escaped quotes');
    } else {
        console.log('❌ Still not found. Checking raw bytes...');
        const idx = content.indexOf('Current Year Earnings');
        if (idx >= 0) {
            console.log('Found at char', idx, ':');
            console.log(JSON.stringify(content.slice(idx, idx + 80)));
        }
    }
}

// Verify
const final = fs.readFileSync(path, 'utf8');
const check = final.includes('mNetProfitCumulative');
console.log(`\nVerification: mNetProfitCumulative appears ${(final.match(/mNetProfitCumulative/g) || []).length} times in file`);
