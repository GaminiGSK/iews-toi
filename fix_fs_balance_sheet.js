const fs = require('fs');
let code = fs.readFileSync('client/src/pages/FinancialStatements.jsx', 'utf8');

// The user prefers "Balance Sheet / តារាងតុល្យការ" over the IFRS "Statement of Financial Position / របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ".
code = code.replace(/របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ\s*\/ STATEMENT OF FINANCIAL POSITION/g, 'តារាងតុល្យការ / BALANCE SHEET');
code = code.replace(/របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ\/\s*STATEMENT OF FINANCIAL POSITION/g, 'តារាងតុល្យការ / BALANCE SHEET');
code = code.replace(/របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ\s*\/ Balance Sheet/g, 'តារាងតុល្យការ / Balance Sheet');
code = code.replace(/"STATEMENT OF FINANCIAL POSITION"/g, '"BALANCE SHEET"');
code = code.replace(/bs:\s*"STATEMENT OF FINANCIAL POSITION"/g, 'bs: "BALANCE SHEET"');

fs.writeFileSync('client/src/pages/FinancialStatements.jsx', code, 'utf8');
console.log('Balance sheet title changed to User Preference!');
