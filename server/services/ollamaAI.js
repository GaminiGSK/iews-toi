const fs = require('fs');
const path = require('path');

// Models available in local Ollama:
// 1. deepseek-v3.1:671b-cloud
// 2. deepseek-coder-v2:16b-lite-instruct-q4_K_M

const DEFAULT_MODEL = "deepseek-coder-v2:16b-lite-instruct-q4_K_M";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

exports.chatWithOllamaAgent = async (message, context, imageBase64, modelId = DEFAULT_MODEL) => {
    try {
        const { companyName, profile, codes, recentTransactions, summary, monthlyStats, ui } = context;

        const systemPrompt = `
            You are an expert, conversational Financial Assistant (BA) for the company "${companyName}".
            Your goal is to be helpful, professional, and engaging.
            
            **KNOWLEDGE BASE (Cambodian Tax Law - TOI):**
            You have access to a deep knowledge of Cambodian Tax Law and TOI (Table of Income) requirements.
            
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
