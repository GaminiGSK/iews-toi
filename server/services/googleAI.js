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
    console.log(`[GoogleAI] Using API Key ending in: ...${apiKey.slice(-4)}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: "You are an expert Financial AI Agent. Your job is to extract bank transaction data and tax form layouts with 100% accuracy."
    });
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

        const result = await getModel().generateContent([prompt, imagePart]);
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
            Analyze this Bank Statement image visually.
            1. **Layout Detection**: Locate the main "Account Activity" or "Transaction History" table. IGNORE headers, footers, and carry-forward noise.
            2. **Data Extraction**: Extract every single TRANSACTION row from the table into a JSON Array.
            
            JSON Schema:
            [
              {
                "date": "YYYY-MM-DD", // REQUIRED. Inferred Year from header + Date in row. Use ISO format YYYY-MM-DD.
                "description": "Full verbatim description text. Do NOT summarize. Include REF#, Time, Remarks.",
                "moneyIn": 0.00, // Number. If empty/dash, use 0.
                "moneyOut": 0.00, // Number. If empty/dash, use 0.
                "balance": "0.00" // String representation of the balance column
              }
            ]

            Rules:
            - **CRITICAL**: If a row does NOT have a clear transaction date, SKIP IT.
            - **YEAR DETECTION**: Look for 'Statement Date', 'Period', or 'Date' header at the top to determine the correct YEAR. 
            - If rows only show 'DD MMM' (e.g. 15 Feb), append the YEAR found in the header. 
            - If "Money In" and "Money Out" are in one column (Signed), separate them based on sign.
            - Output ONLY the JSON Array. No Markdown blocks.
        `;

        // Robust Mimetype Detection
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

        const filePart = fileToGenerativePart(filePath, mimeType);

        const result = await getModel().generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        console.log("[GeminiAI] Raw Output Length:", text.length);
        let data = cleanAndParseJSON(text);

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("[GeminiAI] Output Invalid/Empty. Raw:", text.substring(0, 100));
            return [{
                date: "DEBUG_ERR",
                description: "AI Parse Failed. Please try another image or check the file quality. Raw: " + text.substring(0, 200).replace(/\n/g, ' '),
                moneyIn: 0,
                moneyOut: 0,
                balance: "0.00"
            }];
        }

        // AGENTIC STAGE 3: DATA VALIDATION
        // Be more liberal with dates - as long as it looks like a date, keep it.
        data = data.filter(tx => tx.date && tx.date.length >= 6);

        return data;

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
        const result = await getModel().generateContent(prompt);
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
        1. **Income (Positive Amount)**: ALWAYS tag as "10110" (Cash On Hand).
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
        const result = await getModel().generateContent(prompt);
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
        const { companyName, profile, codes, recentTransactions, summary, monthlyStats, ui } = context;
        const prompt = `
            You are an expert, conversational Financial Assistant (BA) for the company "${companyName}".
            Your goal is to be helpful, professional, and engaging. Don't just execute tasks; talk to the user like a human partner.

            **CONVERSATIONAL RULES**:
            1. **No Robotic Replies**: Avoid jumping directly into tasks. Explain concepts briefly or ask clarifying questions first.
            2. **Subject Proposals**: If a user asks a broad question (e.g., "Income tax") or at the start of a session, provide a short explanation and propose 3-4 potential subjects they might want to explore (e.g., PTOI, Corporate Rates, Filing Deadlines).
            3. **Profile Awareness**: Check the "Company Identity" section below. If key fields like Registration ID, VAT/TIN, Address, or Incorporation Date are "N/A" or missing, point this out conversationally. Say: "Your business information is currently incomplete (missing [specific fields]). Completing this will help me provide better tax evaluations."
            4. **Income Tax Evaluation**: If the user asks about Income Tax:
               - If the profile is incomplete, mention that a full evaluation requires those details first.
               - If the profile is complete and there are transactions, perform a high-level evaluation using "Cambodian Tax Law" knowledge below.

            **Company Identity (MOC/Tax Profile):**
            - **Entity Name (EN)**: ${profile?.nameEn || "N/A"}
            - **Entity Name (KH)**: ${profile?.nameKh || "N/A"}
            - **Registration ID**: ${profile?.regId || "N/A"}
            - **VAT/TIN**: ${profile?.taxId || "N/A"}
            - **Incorporation Date**: ${profile?.incDate || "N/A"}
            - **Address**: ${profile?.addr || "N/A"}
            - **Type**: ${profile?.type || "N/A"}

            **Current Financial Context:**
            - **Net Balance**: ${summary.balance}
            - **Total Income**: ${summary.income}
            - **Total Expenses**: ${summary.expense}
            - **Recent Monthly Net**: ${monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1].net : "N/A"}

            **KNOWLEDGE BASE (Cambodian Tax Law - TOI):**
            ${TOI_KNOWLEDGE}

            **App Context (User UI):**
            - **Current Page**: ${ui?.route || "Dashboard"}

            **User Query**: "${message}"

            **Instructions for Specialized Actions (JSON Output Required if Triggered):**
            1. **Proposing Actions**: If information is missing or transactions need work, output JSON:
               { "tool_use": "propose_action", "action": "trigger_analysis" | "fill_year" | "fill_company", "reply_text": "[PUT YOUR FULL CONVERSATIONAL RESPONSE HERE]" }

            2. **Executing Actions**: If user says "Yes/Go/Process" to a proposal:
               { "tool_use": "workspace_action", "action": "...", "reply_text": "Starting the process for you now!" }

            3. **Journal Entries**: If user asks for adjustments (depreciate/accrue):
               { "tool_use": "propose_journal_entry", "journal_data": { ... }, "reply_text": "I've prepared the adjustment. [Explain what you did]." }

            **CRITICAL**: If you use ANY JSON tool, your entire conversational response MUST be placed inside the \`reply_text\` field of the JSON. If you are NOT using a tool, just respond with plain text.

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

        const result = await getModel().generateContent(inputs);
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
