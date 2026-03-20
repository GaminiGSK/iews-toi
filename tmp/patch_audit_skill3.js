const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

// Find the AUDIT SKILL section start
const startMarker = '**AUDIT SKILL';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) { console.error('AUDIT SKILL not found'); process.exit(1); }

// Find what comes AFTER the section — find KNOWLEDGE BASE which comes next
const endMarker = '**KNOWLEDGE BASE';
const endIdx = content.indexOf(endMarker, startIdx);
if (endIdx === -1) { console.error('KNOWLEDGE BASE not found after AUDIT SKILL'); process.exit(1); }

console.log('Replacing chars', startIdx, 'to', endIdx);

const newSection = `**AUDIT SKILL - BANK STATEMENT vs GL COMPARISON (MANDATORY INSTRUCTIONS):**

            When the user asks "check bank statement difference", "compare", "any difference", "check system bank", or similar:
            1. You MUST NOT escalate or say you are struggling. This is your CORE SKILL.
            2. Read ALL transactions from the PHYSICAL BANK STATEMENT AUDIT MEMORY section above.
            3. Read ALL transactions from the Recent General Ledger Transactions section above.
            4. For EACH bank statement transaction, search the GL for a matching entry:
               - Match by: date within 3 days AND amount (exact moneyIn or moneyOut within $0.02)
               - FOUND in GL = MATCH OK
               - NOT FOUND in GL = MISSING (critical error)
            5. Also scan: GL entries that do NOT appear in bank statement = PHANTOM entries
            6. Output a clear formatted report:
               - List every bank transaction with match status (FOUND or MISSING)
               - Highlight all MISSING entries with exact date and amount
               - Show totals: X matched, Y missing, Z phantom
               - Final verdict: PASS (all match) or FAIL (discrepancies found)
            7. After the report, ask ONE targeted question about the first discrepancy found.

            When user drops a new page: record only transactions on that specific page, prompt for next page.
            When quarter is complete: run the full bank-vs-GL comparison automatically.

            `;

content = content.substring(0, startIdx) + newSection + content.substring(endIdx);
fs.writeFileSync(file, content, 'utf8');
console.log('Done. File written successfully.');
