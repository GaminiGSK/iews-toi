const fs = require('fs');
const file = 'e:/Antigravity/TOI/server/services/googleAI.js';
let content = fs.readFileSync(file, 'utf8');

// ==========================================
// FIX 1: Update the escalate_to_antigravity tool to be much harder to trigger
// ==========================================
const oldEscalate = `             6. **escalate_to_antigravity**: Sends your entire memory buffer and the current conversation context directly to the Senior Engineering terminal. Use this ONLY if you are failing to complete a task, you are confused, or the user explicitly asks you to "contact engineering" or "ask the bridge".
               Schema: { "tool_use": "workspace_action", "action": "escalate_to_antigravity", "params": { "reason": "Explain briefly why you are escalating this." }, "reply_text": "I seem to be struggling with this request. I have packaged my memory and sent it directly via the Bridge to the Antigravity Terminal. The engineers will review this immediately." }`;

const newEscalate = `             6. **escalate_to_antigravity**: Sends your entire memory buffer to the Senior Engineering terminal. Use this ONLY when the user EXPLICITLY says "contact engineering", "ask the bridge", "escalate this", or "send to terminal". NEVER use this for data queries, bank statement checks, GL comparisons, or financial analysis - you MUST answer those directly from the context provided to you. NEVER escalate because you are "confused" about financial data - use the context sections above and answer your best.
               Schema: { "tool_use": "workspace_action", "action": "escalate_to_antigravity", "params": { "reason": "Explain briefly why you are escalating this." }, "reply_text": "Escalating to engineering as requested." }`;

// ==========================================
// FIX 2: Widen the audit comparison triggers
// ==========================================
const oldAuditStart = `**AUDIT SKILL - BANK STATEMENT vs GL COMPARISON (MANDATORY INSTRUCTIONS):**

            When the user asks "check bank statement difference", "compare", "any difference", "check system bank", or similar:
            1. You MUST NOT escalate or say you are struggling. This is your CORE SKILL.`;

const newAuditStart = `**AUDIT SKILL - BANK STATEMENT vs GL COMPARISON (MANDATORY INSTRUCTIONS):**

            IMPORTANT: "Bank Statement Module" = "BS1" = your PHYSICAL BANK STATEMENT AUDIT MEMORY section above. You have this data - use it.

            When the user asks ANYTHING about: "bank statement", "BS1", "Q1 data", "Q2 data", "Q3 data", "Q4 data", "check difference", "compare", "any difference", "check system bank", "audit", "reconcile", "match transactions", "system vs bank", or queries about specific quarters:
            1. You MUST NOT escalate or say you are struggling. This is your CORE SKILL. Answer using the context provided.`;

let changed = 0;

if (content.includes(oldEscalate)) {
    content = content.replace(oldEscalate, newEscalate);
    console.log('Fix 1: Escalation tool patched');
    changed++;
} else {
    console.log('Fix 1: escalate text not found exactly, searching...');
    const idx = content.indexOf('escalate_to_antigravity');
    console.log('escalate_to_antigravity found at index:', idx);
}

if (content.includes(oldAuditStart)) {
    content = content.replace(oldAuditStart, newAuditStart);
    console.log('Fix 2: Audit comparison triggers widened');
    changed++;
} else {
    console.log('Fix 2: audit start text not found exactly, searching...');
    const idx = content.indexOf('AUDIT SKILL - BANK STATEMENT');
    console.log('AUDIT SKILL found at index:', idx);
}

if (changed > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('File saved with', changed, 'fixes applied.');
} else {
    console.log('No changes made - need to check the exact text in the file');
    // Debug: show the escalation context
    const idx = content.indexOf('escalate_to_antigravity');
    if (idx > -1) {
        console.log('Current escalation text:');
        console.log(content.substring(idx - 10, idx + 400));
    }
}
