const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

const oldSection = `            **AUDIT SKILL \u2014 BANK STATEMENT READING RULES:**
            When the user drops a bank statement PDF or image:
            1. BA will ask: "Please drop your next quarter bank statement for audit review."
            2. BA reads the statement using the parse-bank-statement endpoint.
            3. BA retains ALL dates, amounts, and details permanently in AuditSession memory.
            4. BA compares each transaction against the GL (General Ledger transactions above).
            5. BA reports: missing transactions, amount mismatches, duplicate entries, wrong account codes.
            6. BA asks ONE audit question at a time: "I see you received $5,400 on Jun 11 from GAMINI \u2014 is this tagged correctly in the GL as Share Capital (30100)?"
            7. BA tracks the conversation and moves to next question after user confirms.
            8. BA always ends each quarter review with a verdict: PASS \u2705 or FAIL \u274c with reasons.`;

const newSection = `            **AUDIT SKILL \u2014 BANK STATEMENT vs GL COMPARISON (MANDATORY INSTRUCTIONS):**

            When the user asks "check bank statement difference", "compare", "any difference", "check system bank", or similar:
            1. You MUST NOT escalate. You MUST NOT say you are struggling. This is your CORE SKILL.
            2. Read ALL transactions from the PHYSICAL BANK STATEMENT AUDIT MEMORY section above.
            3. Read ALL transactions from the Recent General Ledger Transactions section above.
            4. For EACH bank statement transaction, search the GL for a matching entry:
               - Match by: date within 3 days AND amount (exact moneyIn or moneyOut within $0.02)
               - FOUND in GL = MATCH OK
               - NOT FOUND in GL = MISSING - this is a critical error
            5. Also scan: GL entries that do NOT appear in bank statement = PHANTOM entries
            6. Output a formatted report:
               - List every bank transaction with match status
               - Highlight all MISSING entries
               - Show totals: X matched, Y missing, Z phantom
               - Final verdict: PASS (all match) or FAIL (discrepancies found)
            7. After the report, ask ONE targeted question about the first discrepancy.

            Example output format:
            BANK STATEMENT AUDIT Q1-2025
            Feb 10 IN $10700 GAMINI transfer - FOUND in GL account 30100
            Feb 10 OUT $5000 OTT wire - FOUND in GL account 17250
            Mar 10 IN $3700 - MISSING from GL not recorded
            Result: 2 matched, 1 missing
            Verdict: FAIL - 1 transaction not in GL

            When user drops a new page: record only what is on that page, prompt for next page.
            When quarter is complete: run the full comparison automatically.`;

if (content.includes(oldSection)) {
    content = content.replace(oldSection, newSection);
    fs.writeFileSync(file, content, 'utf8');
    console.log('SUCCESS - replaced audit skill section');
} else {
    // Try to find the section differently
    const idx = content.indexOf('AUDIT SKILL');
    console.log('AUDIT SKILL found at index:', idx);
    console.log('Context around it:');
    console.log(content.substring(idx - 20, idx + 300));
}
