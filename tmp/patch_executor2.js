const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

// Find the CRITICAL EXECUTOR LOOP section and "Answer:" which comes after it
const startIdx = content.indexOf('**CRITICAL EXECUTOR LOOP**');
const endIdx = content.indexOf('Answer:\n        `', startIdx);

if (startIdx === -1) { console.error('CRITICAL EXECUTOR LOOP not found'); process.exit(1); }
if (endIdx === -1) { 
    // try with \r\n
    const endIdx2 = content.indexOf('Answer:\r\n        `', startIdx);
    console.log('endIdx2:', endIdx2);
}

const endIdx2 = content.indexOf('Answer:', startIdx);
console.log('Start:', startIdx, 'End:', endIdx2);

const newExecLoop = `**CRITICAL EXECUTOR LOOP**:
            1. Is the user asking about bank statement data, Q1/Q2/Q3/Q4 data, GL comparison, audit, balance check, or ANY financial data? Answer in PLAIN TEXT using the context already provided. NEVER use escalate_to_antigravity for financial queries.
            2. Did the user ask for a specific ACTION (fill form, bulk tag, journal entry, refresh, chart), OR confirm "yes/do it"? Use the matching tool JSON.
            3. All other questions: PLAIN TEXT only.
            4. ABSOLUTE RULE: Do NOT escalate unless user explicitly says "contact engineering" or "ask the bridge".

            `;

content = content.substring(0, startIdx) + newExecLoop + content.substring(endIdx2);
fs.writeFileSync(file, content, 'utf8');
console.log('Done. Executor loop patched.');
