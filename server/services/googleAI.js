const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// DYNAMIC API KEY GETTER - Ensures fresh read from environment
function getApiKey() {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("FATAL ERROR: GEMINI_API_KEY is missing from environment variables!");
        throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not configured in Cloud Run Environment Variables.");
    }
    return key;
}

// LAZY INITIALIZATION - Create model instance only when needed
function getModel() {
    const apiKey = getApiKey();
    console.log(`[GoogleAI] Initializing with API Key ending in: ...${apiKey.slice(-4)}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Using 2.0 as 1.5 reported 404 not found in this environment
        systemInstruction: "You are an expert Financial AI Agent. Your job is to extract bank transaction data and tax form layouts with 100% accuracy."
    });
}

// RETRY HELPER with Exponential Backoff
async function callGeminiWithRetry(fn, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRateLimit = error.message.includes('429') || (error.status === 429);
            const is500 = error.status >= 500;

            if (isRateLimit || is500) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.warn(`[GeminiAI] ${isRateLimit ? 'Rate Limited' : 'Server Error'} (Attempt ${i + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error; // Not a retryable error
        }
    }
    throw lastError;
}

// Helper to encode file to base64
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

exports.extractDocumentData = async (filePath, docType) => {
    console.log(`[GeminiAI] Processing Document (Vision 2.0): ${filePath} (Type: ${docType})`);
    try {
        let prompt = "Analyze this business document image visually and extract all data into a strict JSON object.";

        // Contextual Prompts based on Doc Type
        switch (docType) {
            case 'moc_cert':
                prompt += `
                Extract specific fields from this MOC Certificate:
                - companyNameEn (String)
                - companyNameKh (String)
                - registrationNumber (String)
                - incorporationDate (Format: DD/MM/YYYY)
                - address (String: Full Address)
                `;
                break;
            case 'kh_extract':
            case 'en_extract':
                prompt += `
                Extract from this Business Extract:
                - companyNameEn
                - companyNameKh
                - registrationNumber
                - businessActivity (String summary)
                - capitalAmount (Number or String)
                - directorName (String)
                `;
                break;
            case 'tax_patent':
            case 'tax_id':
                prompt += `
                Extract from Tax/VAT Certificate:
                - vatTin (String)
                - companyNameKh
                - taxRegistrationDate
                `;
                break;
            case 'bank_opening':
                prompt += `
                Extract from Bank Account Confirmation Letter:
                - bankName
                - bankAccountNumber
                - bankAccountName
                - bankCurrency
                `;
                break;
            default:
                prompt += " Extract: companyNameEn, companyNameKh, registrationNumber, address, vatTin.";
        }

        prompt += `
        \nRETURN ONLY RAW JSON. No Markdown. No Code Blocks.
        If a field is not found, return null for that field.
        `;

        // Vision Model supports various image types
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.pdf') mimeType = 'application/pdf';

        const imagePart = fileToGenerativePart(filePath, mimeType);

        const result = await callGeminiWithRetry(() => getModel().generateContent([prompt, imagePart]));
        const response = await result.response;
        const text = response.text();

        console.log("[GeminiAI] Doc Extract Raw:", text.substring(0, 50) + "...");
        return cleanAndParseJSON(text);

    } catch (error) {
        console.error("Gemini API Error (Doc):", error);
        return { error: "Extraction failed", details: error.message };
    }
};

exports.extractBankStatement = async (filePath) => {
    console.log(`[GeminiAI] Scanning Bank Statement (Vision 2.0): ${filePath}`);

    try {
        // AGENTIC PROMPT: STAGE 1 (Layout) & STAGE 2 (Structure)
        const prompt = `
            Analyze this bank statement visually and extract all transactions with high precision.
            
            1. **Header Identification**: Locate the Bank Name, Account Number, and Account Name.
            2. **Statement Year**: Find the year of the statement (Crucial for dating rows).
            3. **Table Extraction**: Locate the transaction table. Identify columns for:
               - Date (Day and Month)
               - Description / Particulars
               - Money In (Credit / Deposit)
               - Money Out (Debit / Withdrawal)
               - Balance
            
            Return ONLY a clean JSON object:
            {
              "bankName": "...",
              "accountNumber": "...",
              "accountName": "...",
              "transactions": [
                {
                  "date": "YYYY-MM-DD", // Use inferred year + row's day/month.
                  "description": "Full verbatim text. Preserve Khmer characters if present.",
                  "moneyIn": 0.00,
                  "moneyOut": 0.00,
                  "balance": "0.00"
                }
              ]
            }

            Rules:
            - **BILINGUAL**: Support English and Khmer text in descriptions.
            - **YEAR INFERENCE**: If year is not found, use the current year (2026).
            - **FLATTENING**: Remove any line breaks or extra spaces within descriptions.
            - **ACCURACY**: Ensure moneyIn and moneyOut are correctly assigned based on the column headers.
        `;

        // Robust Mimetype Detection
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

        const filePart = fileToGenerativePart(filePath, mimeType);

        const result = await callGeminiWithRetry(() => getModel().generateContent([prompt, filePart]));
        const response = await result.response;
        const text = response.text();

        console.log("[GeminiAI] Raw Output Length:", text.length);
        let data = cleanAndParseJSON(text);

        // STAGE 2: STRUCTURE NORMALIZATION
        // Support both raw array and structured object with .transactions key
        let transactions = Array.isArray(data) ? data : (data?.transactions || []);

        if (transactions.length === 0) {
            console.warn("[GeminiAI] Output Invalid/Empty. Raw:", text.substring(0, 50));
            return [{
                date: "DEBUG_ERR",
                description: "AI Parse Failed. Please check the file quality. Raw: " + text.substring(0, 100).replace(/\n/g, ' '),
                moneyIn: 0,
                moneyOut: 0,
                balance: "0.00"
            }];
        }

        // STAGE 3: DATA VALIDATION & FILTERING
        // Be liberal with dates but ensure they exist
        transactions = transactions.filter(tx => tx.date && String(tx.date).length >= 5);

        // Update the original structure with filtered transactions
        if (Array.isArray(data)) {
            return transactions;
        } else {
            return { ...data, transactions };
        }

    } catch (error) {
        console.error("Gemini API Error (Bank):", error);
        return [{
            date: "FATAL_ERR",
            description: "API Failure: " + error.message,
            moneyIn: 0,
            moneyOut: 0,
            balance: "0.00"
        }];
    }
};

exports.extractRawText = async (filePath) => {
    console.log(`[GeminiAI] Extracting Raw Text (Vision 2.0): ${filePath}`);
    try {
        const prompt = "Please perform OCR on this document and extract all text verbatim. Preserve the layout as much as possible. Provide both Khmer and English text clearly. Return the result as a plain text string.";

        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.webp') mimeType = 'image/webp';

        const imagePart = fileToGenerativePart(filePath, mimeType);
        const result = await callGeminiWithRetry(() => getModel().generateContent([prompt, imagePart]));
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini API Error (Raw Text):", error);
        return "Extraction failed: " + error.message;
    }
};

exports.extractFromBuffer = async (buffer, mimeType) => {
    console.log(`[GeminiAI] Processing Buffer (Vision 2.0): ${mimeType}`);
    try {
        const prompt = "Analyze this business document image visually and extract all text exactly as shown. Maintain the layout if possible. Output raw text (Bilingual KH/EN if applicable).";

        const imagePart = {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType
            },
        };

        const result = await callGeminiWithRetry(() => getModel().generateContent([prompt, imagePart]));
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini API Error (Buffer):", error);
        return "Extraction failed: " + error.message;
    }
};

exports.summarizeToProfile = async (rawText) => {
    console.log(`[GeminiAI] Organizing Raw Text into Business Profile...`);
    try {
        const prompt = `
            You are a Senior Business Analyst and Corporate Documentation Specialist. 
            Your task is to transform raw OCR text (Khmer and English) into a comprehensive "Business Profile Dossier".
            
            This document must be exhaustive. Reconstruct the entity's complete identity.
            
            STRUCTURE THE DOCUMENT AS FOLLOWS:

            # I. EXECUTIVE CORPORATE ARCHITECTURE
            - **Legal Name**: (Unified English & Khmer)
            - **Identifiers**: (Company ID, Tax TIN, Patent IDs)
            - **Legal Status**: (Company Type, Incorporation Date)
            
            # II. GOVERNANCE & SHAREHOLDERS
            - **Board of Directors**: (Exhaustive list of directors/authorized signatories)
            - **Shareholders**: (Detailed ownership list with percentage/nationalities if found)
            
            # III. OPERATIONAL FOOTPRINT
            - **Headquarters**: (Full physical address in EN/KH)
            - **Business Objectives**: (List every identified commercial activity mentioned)
            
            # IV. FINANCIAL & LEGAL ASSETS
            - **Capital**: (Capital value, currency, share distribution)
            - **Bank Details**: (Known account numbers/bank associations)
            
            # V. ANALYST STRATEGIC DOSSIER
            (8-10 sentence formal strategic overview talking about the entity's longevity, diversity of objectives, and verified leadership structure.)

            RAW DATA:
            ${rawText}
            
            STRICT RULES:
            - **Exhaustive Detail**: If a shareholder or objective is in the raw text, INCLUDE IT.
            - **Fidelity**: No hallucinations. Professional, objective tone.
            - **Format**: Markdown with high-end hierarchy (headings, bold keys).
        `;

        const result = await callGeminiWithRetry(() => getModel().generateContent(prompt));
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini AI Error (Summarize):", error);
        return "Failed to organize profile: " + error.message;
    }
};

exports.translateText = async (text, targetLang) => {
    return text + " (Translated)";
};

exports.generateMatchDescription = async (code, description) => {
    // Generate a description of what kind of bank transactions would match this account
    const prompt = `
        You are an expert Accountant and Researcher.
        Task: Provide a comma-separated list of 3-5 typical, real-world bank transaction descriptions that would correspond to the General Ledger account: "${code} - ${description}".
        
        Guidelines:
        - Research/Think: What does this account code actually represent in a business context?
        - Specificity: Don't just say "payment". Be specific like "Vattanac Bank Fee", "Google Workspace Subscription", "Payroll Transfer - Jan".
        - Format: Return ONLY the comma-separated string. No quotes, no markdown.
        
        Example for "Utilities": "EDC Electricity Bill, PPWSA Water Bill, ISP Internet Charge"
    `;
    try {
        const result = await callGeminiWithRetry(() => getModel().generateContent(prompt));
        const text = result.response.text();
        return text.trim();
    } catch (e) {
        console.error("Gemini Match Desc Error:", e);
        return "";
    }
};

exports.suggestAccountingCodes = async (transactions, codes) => {
    console.log(`[GeminiAI] Auto-Tagging ${transactions.length} transactions with ${codes.length} codes.`);

    // Prepare the Prompt Data
    // We only need basic info to save tokens
    const codeList = codes.map(c => `${c.code}: ${c.description} ${c.matchDescription ? `(Matching: ${c.matchDescription})` : ''} (TOI: ${c.toiCode})`).join('\n');
    const txList = transactions.map(t => `ID: ${t._id} | Desc: ${t.description} | Amount: ${t.amount}`).join('\n');

    const prompt = `
        You are an expert Accountant.
        Here is my Chart of Accounts:
        ${codeList}

        Here is a list of Bank Transactions:
        ${txList}

        Task:
        Assign the most appropriate Account Code to each transaction based on its description and amount.
        
        CRITICAL RULES (User Defined):
        1. **Income (Positive Amount)**: 
           - IF Description contains "Kassapa Gamini Gunasingha" OR "Capital Injection": ALWAYS tag as "30000" (Owner Equity / Paid-in Capital).
           - IF Description contains "Loan" or "Foreign Unit Transfer": Assign to 20100, 27100, 21100, or 27500 as appropriate.
           - OTHERWISE: Tag as "10110" (Cash On Hand).
        2. **Expenses (Negative Amount)**:
           - IF Amount is between -$0.01 and -$10.00: Tag as "61220" (Bank Charges).
           - IF Amount is between -$10.01 and -$100.00: Tag as "61100" (Commission).
           - IF Amount is less than -$100.00 (e.g. -500): Tag as "61070" (Payroll Expenses).
        
        General Guidelines (Only if rules above don't apply):
        - Use "Context Clues" from the description.
        - If unsure, pick the closest match.

        Output strictly a JSON Array of objects:
        [
            { "transactionId": "...", "accountCode": "..." },
            ...
        ]
        The "accountCode" value must matched the 'code' field provided (e.g. "61220").
        Return ONLY valid JSON.
    `;

    try {
        const result = await callGeminiWithRetry(() => getModel().generateContent(prompt));
        const response = await result.response;
        const text = response.text();
        const suggestions = cleanAndParseJSON(text);

        if (!Array.isArray(suggestions)) return [];

        return suggestions;
    } catch (e) {
        console.error("Gemini Auto-Tag Error:", e);
        return [];
    }
};

const TOI_KNOWLEDGE = require('../data/toi_knowledge'); // Import Knowledge Base

exports.chatWithFinancialAgent = async (message, context, imageBase64) => {
    try {
        const { companyName, profile, codes, recentTransactions, summary, monthlyStats, yearlyStats, ui, brData, history } = context;

        let historyStr = "No previous conversation.";
        if (history && history.length > 0) {
            historyStr = history.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n');
        }

        const prompt = `
            You are an expert, conversational Financial Assistant and **System Auditor & Analyst** for the company "${companyName}".
            Your goal is to be helpful, professional, and engaging. Don't just execute tasks; talk to the user like a human partner.

            **NEW ROLE CAPABILITIES:**
            As the System Auditor & Analyst, you are responsible for monitoring the consistency of the General Ledger and tracking down financial discrepancies.

            **CONVERSATIONAL RULES & TASKS**:
            1. **Primary Task (Ledger Auditing)**: You must monitor the consistency of the General Ledger. Treat the accounting equation (Total Assets = Total Liabilities + Total Equity) as law. If asked about discrepancies (like a missing $72k), you must automatically conceptualize scanning transaction logs to locate the missing debits or credits.
            2. **Direct Answers First**: If the user asks for specific numbers, totals, or data (e.g., "total income for 2025"), you MUST provide those numbers immediately and clearly before saying anything else. DO NOT defer the answer or prioritize pleasantries over the exact data requested.
            3. **Financial Analysis (2025 Money In/Out)**: When asked for year-over-year data or specific year flow (e.g., 2025 Net):
               - Query the prior year closing balance as a baseline.
               - Aggregate all credits (Money In) and debits (Money Out) for the target year.
               - Calculate the delta and verify it against available bank balance data.
            4. **No Evasiveness**: Do not say "I can help with that" and then fail to provide the numbers. Read the context provided below and give the real values.
            5. **No Unprompted Proposals**: NEVER propose "subjects to explore" (like PTOI or tax laws) unless the user explicitly asks you to explain tax concepts. If the user is confirming an action (like saying "yes" to tagging), DO NOT start talking about general tax subjects. Just say you are doing the action.
            6. **Profile Awareness**: Check the "Company Identity" section below. If key fields like Registration ID, VAT/TIN, Address, or Incorporation Date are "N/A" or missing, point this out conversationally. Say: "Your business information is currently incomplete (missing [specific fields]). Completing this will help me provide better tax evaluations."
            7. **Income Tax Evaluation**: If the user asks about Income Tax:
               - If the profile is incomplete, mention that a full evaluation requires those details first.
               - If the profile is complete and there are transactions, perform a high-level evaluation using "Cambodian Tax Law" knowledge below.

            **Business Registration (BR) Context (Verified Intel Fragments):**
            ${brData && brData.length > 0 ? brData.map(doc => `[${doc.name}]: ${doc.text}`).join('\n\n') : "No direct BR document fragments available for this query session."}

            **Company Identity (MOC/Tax Profile Summary):**
            - **Entity Name (EN)**: ${profile?.nameEn || "N/A"}
            - **Entity Name (KH)**: ${profile?.nameKh || "N/A"}
            - **Registration ID**: ${profile?.regId || "N/A"}
            - **VAT/TIN**: ${profile?.taxId || "N/A"}
            - **Incorporation Date**: ${profile?.incDate || "N/A"}
            - **Address**: ${profile?.addr || "N/A"}
            - **Type**: ${profile?.type || "N/A"}
            **ROLE: PROFESSIONAL FINANCIAL AUDITOR (IFRS & GDT Standards)**
            You are the GK Blue Agent (System Auditor). You have full access to the database via the live sync API.
            **Mandatory Audit Rules:**
            1. **Balance Check**: Verify Assets = Liabilities + Equity. If Assets - (Liabilities + Equity) is not zero, flag the "UNBALANCED" status in RED and identify the exact discrepancy amount.
            2. **2025 Continuity & Income Rules**: The 2025 opening balance must naturally follow ledger history. All "Money In" (Deposits) must be categorized as Revenue (10110) UNLESS they are Capital Injections or Loans. 
               - **Capital Injections**: Any incoming funds from "Kassapa Gamini Gunasingha" or labeled "Capital Injection" MUST be classified as Owner Equity (30000), NOT Revenue.
               - **Loans/Transfers**: Ensure bank loans are 20100 or 27100, and related-party transfers are 21100 or 27500.
            3. **Expense Cleanup**: Always check Account 17250 and Account 61070 for missing or untagged transactions. Recommend reclassification of "Registration" fees to 61241 and "Owner Withdrawals" to Equity/Drawings exactly as seen in the sync export.
            4. **Visuals**: Use the Recharts library to generate "Assets vs. Liabilities + Equity" or "Money In vs. Money Out" bar charts to explicitly prove your math checks.

            **ULTRA-PERSISTENT SCANNING & MANDATORY EXHAUSTIVENESS**:
            When the user asks for "Business Activities" or "Codes", you MUST enter "Exhaustive Audit Mode".
            1. **Zero Omissions**: You are FORBIDDEN from summarizing. If there are 8 activities in the document, you MUST list all 8. 
            2. **Target Patterns**: Target strings like "62010", "68209", "33200", "69200", "82990", "70200", "45102", "47910". These are ALL present in the GKSMART [kh_extractation].
            3. **Verification Loop**: Before finalizing your answer, count the codes. If you found fewer than 8 for GKSMART, you are missing data. RE-SCAN THE ENTIRE TEXT.
            4. **Format**: Code [ISIC] - Activity Name (Bilingual: Show both Khmer and English text as found in the document).
            5. **No Lazy Replies**: Do not say "Here are some...". Say "Here is the complete and verified list of business activities:".

            **Current Financial Context:**
            - **Total Assets**: ${summary.assets}
            - **Total Liabilities**: ${summary.liabilities}
            - **Total Equity**: ${summary.equity}
            - **Net Balance (All Time)**: ${summary.balance}
            - **Total Income (All Time)**: ${summary.income}
            - **Total Expenses (All Time)**: ${summary.expense}
            **Live Trial Balance (Aggregated across ALL historical transactions):**
            ${context.accountBalances ? Object.entries(context.accountBalances).map(([code, bal]) => `- Account ${code}: $${bal.toFixed ? bal.toFixed(2) : bal}`).join('\n') : 'No aggregated balances available'}
            
            **Chart of Accounts**:
            ${codes ? JSON.stringify(codes) : 'No account codes available'}
            
            **Recent General Ledger Transactions (Last 500 Sample)**:
            ${recentTransactions && recentTransactions.length > 0 ? JSON.stringify(recentTransactions) : 'No recent transactions available'}

            **Harvested Bank Statements Context (from PDF OCR):**
            ${context.harvestedBankStatements && context.harvestedBankStatements.length > 0 ? context.harvestedBankStatements.map(bs => `Bank: ${bs.bankName} | Account: ${bs.accountNumber} | Date Range: ${bs.dateRange}\nTransactions (Preview):\n${bs.transactions.map(tx => `  - Date: ${tx.date}, Desc: ${tx.desc}, IN: ${tx.in}, OUT: ${tx.out}`).join('\n')}`).join('\n\n') : "No harvested bank statements available."}

            **KNOWLEDGE BASE (Cambodian Tax Law - TOI):**
            ${TOI_KNOWLEDGE}

            **App Context (User UI):**
            - **Current Page**: ${ui?.route || "Dashboard"}

            **Conversation History**:
            ${historyStr}

            **Latest Follow-up User Query**: "${message}"

            =========================================
            **EXECUTION CAPABILITIES & TOOL USAGE (MANDATORY RULES)**
            =========================================
            You are an Agent with EXECUTION CAPABILITIES. You can update databases and perform backend tasks using defined TOOLS.
            If the user asks you to perform an action (or confirms an action you just proposed in the chat history), you MUST output your response as a strict JSON block identifying the tool. 
            Do NOT wrap the JSON in conversational fluff. Include your conversational response ONLY inside the 'reply_text' field of the JSON.

            **AVAILABLE TOOL REGISTRY**:

            1. **fill_tax_year**: Executes the tax calculation workspace for a given year.
               Schema: { "tool_use": "workspace_action", "action": "fill_year", "reply_text": "Starting the process for you now!" }

            2. **propose_journal_entry**: Prepares a manual journal adjustment (depreciate, accrue, manual move).
               Schema: { "tool_use": "propose_journal_entry", "journal_data": { "description": "...", "entries": [{ "code": "...", "amount": 0 }] }, "reply_text": "I've prepared the adjustment." }

            3. **bulk_tag_ledger**: Categorizes/tags multiple transactions in the general ledger based on conditions (e.g. "change all money in to 10110" or "tag all expenses as 61220").
               Schema: { "tool_use": "workspace_action", "action": "bulk_tag_ledger", "params": { "condition": "money_in", "targetCode": "10110" }, "reply_text": "Processing the bulk tag update for your ledger." }
               *Valid constraints for params.condition*: "money_in" (amount > 0), "money_out" (amount < 0), "all" (any amount).

            4. **auto_match_codes**: Uses AI directly on the server to auto-match all currently empty/untagged transactions to their most likely Account Code based on description and past behavior.
               Schema: { "tool_use": "workspace_action", "action": "auto_match_codes", "params": {}, "reply_text": "I'll start automatically matching all empty ledger assignments based on your existing rules and my trained AI logic." }

            5. **delete_untagged_transactions**: PERMANENTLY deletes all bank transactions from the ledger that are currently sitting without an Account Code tag. Do not run this unless explicitly requested.
               Schema: { "tool_use": "workspace_action", "action": "delete_untagged_transactions", "params": {}, "reply_text": "I am initiating the mass deletion of all untagged ledger entries as you requested." }

            6. **escalate_to_antigravity**: Sends your entire memory buffer and the current conversation context directly to the Senior Engineering terminal. Use this ONLY if you are failing to complete a task, you are confused, or the user explicitly asks you to "contact engineering" or "ask the bridge".
               Schema: { "tool_use": "workspace_action", "action": "escalate_to_antigravity", "params": { "reason": "Explain briefly why you are escalating this." }, "reply_text": "I seem to be struggling with this request. I have packaged my memory and sent it directly via the Bridge to the Antigravity Terminal. The engineers will review this immediately." }

            7. **generate_chart**: When the user asks to "show a chart," "graph," or visual correlation of the data instead of just text, you can respond with a JSON dataset designed for a Recharts Frontend Component.
               Schema: { "tool_use": "generate_chart", "chart_data": { "type": "bar" | "pie" | "line", "title": "Chart Title", "data": [ { "name": "Category A", "value": 100 }, { "name": "Category B", "value": 200 } ] }, "reply_text": "Here is the visual chart representing the data you requested." }

            **CRITICAL EXECUTOR LOOP**: 
            1. Did the user ask for an action, OR say "yes/do it" to a proposal in the history?
            2. If YES: Find the matching tool in the Registry above. Output ONLY the JSON Schema for that tool.
            3. If NO: You are just answering a question. Output PLAIN TEXT. NO JSON.

            Answer:
        `;

        const inputs = [prompt];

        if (imageBase64) {
            // Parse Data URI
            const matches = imageBase64.match(/^data:(.+?);base64,(.+)$/);
            if (matches) {
                const mimeType = matches[1];
                const data = matches[2];
                inputs.push({
                    inlineData: {
                        data: data,
                        mimeType: mimeType
                    }
                });
                console.log(`[Gemini Chat] Attached Image(${mimeType})`);
            }
        }

        const result = await callGeminiWithRetry(() => getModel().generateContent(inputs));
        const responseText = result.response.text();
        console.log(`[Gemini Chat]Success.Response length: ${responseText.length} `);
        return responseText;

    } catch (e) {
        console.error("!!! GEMINI CHAT CRITICAL ERROR !!!");
        console.error("Error Message:", e.message);
        console.error("Error Status:", e.status);

        // Return real error for debugging
        return `[AI Error]: ${e.message}.(Status: ${e.status || 'N/A'
            }) \n\nPlease ensure the server has been restarted to load the new API key if you just changed it.`;
    }
};




// Utilities
function cleanAndParseJSON(text) {
    try {
        // 1. Attempt strict clean
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Regex fallback: Find the first '[' and last ']' OR '{' and '}' if object
        const matchArray = clean.match(/\[[\s\S]*\]/);
        const matchObj = clean.match(/\{[\s\S]*\}/);

        if (matchArray) clean = matchArray[0];
        else if (matchObj) clean = matchObj[0];

        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Fail. Raw extract:", text.substring(0, 100));
        return null;
    }
}
