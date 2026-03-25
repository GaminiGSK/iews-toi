const fs = require('fs');
const path = 'e:\\Antigravity\\TOI\\client\\src\\pages\\ToiAcar.jsx';

let content = fs.readFileSync(path, 'utf8');

const before = (content.match(/filledData/g) || []).length;

// ──────────────────────────────────────────────────────────
// ISSUE 1: Replace ALL display-context filledData reads
// with displayData so currency conversion works everywhere.
//
// Strategy: Replace filledData?. with displayData?. in JSX value positions.
// Comparisons like `filledData?.X === '...'` also become
// `displayData?.X === '...'` which is safe because displayData
// only converts numbers — string/flag fields pass through unchanged.
// ──────────────────────────────────────────────────────────

// Pattern A: optional-chain property access  filledData?.propName
content = content.replace(/filledData\?\./g, 'displayData?.');

// Pattern B: non-optional access that returns an array element
// e.g.  filledData ? filledData.taxMonths[0]  →  displayData ? displayData.taxMonths[0]
content = content.replace(/filledData \? filledData\./g, 'displayData ? displayData.');

// Pattern C: String(filledData.X)
content = content.replace(/String\(filledData\./g, 'String(displayData?.');

// ── Now RESTORE the places that must keep filledData ──────
// (state variable, setFilledData calls, the displayData memo itself, useEffect deps)
// These were NOT using optional-chaining syntax so they aren't affected by the
// patterns above — they use plain `filledData` (no `?.`). Verify:
const after = (content.match(/filledData/g) || []).length;
const afterDisplay = (content.match(/displayData/g) || []).length;

fs.writeFileSync(path, content, 'utf8');
console.log(`filledData occurrences: ${before} → ${after}`);
console.log(`displayData occurrences: ${afterDisplay}`);
console.log('Done — all display-context reads now go through displayData');
