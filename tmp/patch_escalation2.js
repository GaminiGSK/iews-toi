const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

// Find the exact escalation block by finding its start and next tool entry
const startMarker = '6. **escalate_to_antigravity**';
const endMarker = '7. **refresh_reports**';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1) { console.error('Start not found'); process.exit(1); }
if (endIdx === -1) { console.error('End not found'); process.exit(1); }

console.log('Replacing from', startIdx, 'to', endIdx);

const newBlock = `6. **escalate_to_antigravity**: Sends your entire memory buffer to the Senior Engineering terminal. STRICT USAGE RULE: Use ONLY when the user EXPLICITLY says "contact engineering", "ask the bridge", "escalate", or "send to terminal". NEVER trigger this for: bank statement checks, GL comparisons, financial data queries, Q1/Q2/Q3/Q4 data requests, balance checks, or any audit task — you MUST answer ALL of those directly from the context sections above. Being "confused" about financial data is NOT a reason to escalate — always attempt the analysis first using the data in your context.
               Schema: { "tool_use": "workspace_action", "action": "escalate_to_antigravity", "params": { "reason": "Explain briefly why you are escalating this." }, "reply_text": "Escalating to engineering as explicitly requested." }

            `;

content = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
fs.writeFileSync(file, content, 'utf8');
console.log('Done. Escalation tool restriction updated.');
