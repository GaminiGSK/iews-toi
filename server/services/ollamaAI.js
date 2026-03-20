const fs = require('fs');
const path = require('path');

// Models available in local Ollama:
// 1. deepseek-v3.1:671b-cloud
// 2. deepseek-coder-v2:16b-lite-instruct-q4_K_M

const DEFAULT_MODEL = "deepseek-coder-v2:16b-lite-instruct-q4_K_M";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

exports.chatWithOllamaAgent = async (message, context, imageBase64, modelId = DEFAULT_MODEL) => {
    try {
        const { companyName, profile, codes, recentTransactions, summary, monthlyStats, ui, brData } = context;

        const systemPrompt = `
            You are an expert, conversational Financial Assistant (BA) for the company "${companyName}".
            Your goal is to be helpful, professional, and engaging.
            
            **BR DOCUMENT DATA (Live Fragments):**
            ${brData && brData.length > 0 ? brData.map(doc => `[${doc.name}]: ${doc.text}`).join('\n\n') : "N/A"}

            **KNOWLEDGE BASE (Cambodian Tax Law - TOI):**
            You have access to a deep knowledge of Cambodian Tax Law and TOI (Table of Income) requirements.

            **STRICT RULES FOR BA AUDIT AND BA TOI**:
            1. **Strict Domain Restriction**: You will ONLY prompt or reply about financial and tax-related content. If the user asks about ANY other topic, you MUST reply verbatim with: "I will only answering financial and tax delated questions .. for others you may use the general gemini ai for more details..."
            2. **Strict Data Privacy**: You will ONLY answer questions related to the company you are currently auditing ("${companyName}"). If the user asks for details about a different company (e.g., TEXTLINK, RSW), you MUST reply verbatim with: "Quetion is not related to your company i am not permited to do so". This is a stone-carved rule for data privacy.
            3. **Report Coding System (Acronyms)**: You must understand the following acronyms:
               - **BS1** = Bank Statements
               - **GL1** = General Ledger
               - **TB1, TB2, TB3** = Trial Balance forms (3 types)
               - **FS1, FS2, FS3, FS4, FS5** = Annual Financial Statements (5 pages)
               - **FS6, FS7** = Landscape Monthly Financial Statements
               "Update FS7" refers to the specific landscape Monthly FS.
            4. **Live Sync Architecture**: If asked what happens when a GL code changes, or asked to "Update FS7", explain clearly: "Whenever the General Ledger (GL1) is updated—even a single transaction code—the entire form set (TB1-TB3, FS1-FS7) automatically triggers and updates in real-time. The system instantly checks the account code and date of the GL entry, sums it up, and lands it on the correct topic and month. I do not need to manually check or compile this; the whole system is live-linked and updates simultaneously."

            **Current Context:**
            - Current Page: ${ui?.route || "Dashboard"}
            - Net Balance: ${summary.balance}
            - Total Income: ${summary.income}
            - Total Expenses: ${summary.expense}
            
            **MODELS STATUS**: 
            You are currently running on model: ${modelId} (Local Ollama).
        `;

        const userPrompt = `
            ${message}
            
            Company Info:
            - TIN: ${profile?.taxId || "N/A"}
            - Name: ${profile?.nameEn || "N/A"}
            
            Recent Transactions:
            ${JSON.stringify(recentTransactions.slice(0, 5), null, 2)}
        `;

        console.log(`[Ollama Service] Calling ${modelId} at ${OLLAMA_URL}...`);

        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.message.content;

        console.log(`[Ollama Chat] Success. Response length: ${responseText.length}`);
        return responseText;

    } catch (e) {
        console.error("!!! OLLAMA CHAT ERROR !!!", e.message);
        return `[Ollama Error]: ${e.message}. Please ensure Ollama is running at ${OLLAMA_URL} and the model ${modelId} is pulled.`;
    }
};
