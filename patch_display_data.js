const fs = require('fs');
const path = 'e:\\Antigravity\\TOI\\client\\src\\pages\\ToiAcar.jsx';

let content = fs.readFileSync(path, 'utf8');
const before = (content.match(/filledData/g) || []).length;

// Pattern 1: row.ref._n cells (financial table rows like E28_n, B3_n, D2_n etc.)
content = content.replaceAll(
  "filledData?.[row.ref.replace(' ','')+'_n']",
  "displayData?.[row.ref.replace(' ','')+'_n']"
);

// Pattern 2: direct key with _n suffix e.g. filledData?.['E43_n']
content = content.replace(/filledData\?\.\['([A-Z][0-9]+)_n'\]/g, "displayData?.['$1_n']");

// Pattern 3: dynamic key with _n suffix e.g. filledData?.[someKey+'_n']
content = content.replace(/filledData\?\.\[([^\]]+\+'_n')\]/g, 'displayData?.[$1]');

const after = (content.match(/filledData/g) || []).length;
fs.writeFileSync(path, content, 'utf8');
console.log(`Done. filledData references: ${before} → ${after} (replaced ${before - after})`);
