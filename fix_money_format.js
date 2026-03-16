const fs = require('fs');
const file = 'client/src/pages/FinancialStatements.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all hardcoded 0 decimal formatting with dynamic formatting based on inUSD
content = content.replace(
    /toLocaleString\(undefined,\s*\{\s*minimumFractionDigits:\s*0,\s*maximumFractionDigits:\s*0\s*\}\)/g,
    'toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })'
);

// There are also calls to .toLocaleString() without arguments in the Equity Changes block:
// e.toLocaleString() -> e.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })
content = content.replace(
    /\.toLocaleString\(\)/g,
    '.toLocaleString(undefined, { minimumFractionDigits: inUSD ? 2 : 0, maximumFractionDigits: inUSD ? 2 : 0 })'
);

fs.writeFileSync(file, content);
console.log('Fixed formatting');
