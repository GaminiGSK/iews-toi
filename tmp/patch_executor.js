const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

const oldLoop = `            **CRITICAL EXECUTOR LOOP**: 
            1. Did the user ask for an action, OR say "yes/do it" to a proposal in the history?
            2. If YES: Find the matching tool in the Registry above. Output ONLY the JSON Schema for that tool.
            3. If NO: You are just answering a question. Output PLAIN TEXT. NO JSON.`;

const newLoop = `            **CRITICAL EXECUTOR LOOP**: 
            1. Is the user asking about bank statement data, Q1/Q2/Q3/Q4 data, GL comparison, audit, balance check, or any financial data? -> Answer in PLAIN TEXT using the data already in your context. NEVER use escalate_to_antigravity for any of these.
            2. Did the user ask for a specific ACTION (fill form, bulk tag, journal entry, refresh reports), OR say "yes/do it" to a proposal in the history? -> Use the matching tool. Output ONLY the JSON Schema.
            3. All other questions -> Answer in PLAIN TEXT. NO JSON.
            4. FORBIDDEN: Do NOT use escalate_to_antigravity unless user literally says "contact engineering" or "ask the bridge".`;

if (content.includes(oldLoop)) {
    content = content.replace(oldLoop, newLoop);
    fs.writeFileSync(file, content, 'utf8');
    console.log('DONE - Critical executor loop updated');
} else {
    console.log('Not found exactly. Searching...');
    const idx = content.indexOf('CRITICAL EXECUTOR LOOP');
    console.log('Found at:', idx);
    console.log(JSON.stringify(content.substring(idx, idx + 400)));
}
