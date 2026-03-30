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
function getModel(withTools = false) {
    const apiKey = getApiKey();
    console.log(`[GoogleAI] Initializing with API Key ending in: ...${apiKey.slice(-4)}`);
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let config = {
        model: "gemini-2.0-flash", // Using 2.0 as 1.5 reported 404 not found in this environment
        systemInstruction: "You are an expert Financial AI Agent. Your job is to extract bank transaction data and tax form layouts with 100% accuracy."
    };

    if (withTools) {
       const { agentToolsDefinitions } = require('./agentTools');
       config.tools = agentToolsDefinitions.tools;
    }

    return genAI.getGenerativeModel(config);
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
        const prompt = `You are an expert Document Intelligence Agent for Cambodian Corporate & Tax Documents.
Carefully read this document and extract EVERY data field with 100% accuracy.
Identify if it is a MOC Extract, Patent, Tax Certificate, or Bank Letter, and extract all relevant fields.
Return ONLY a strict JSON object — no markdown, no code fences, no explanation.

{
  "companyNumber": "Company registration number",
  "companyNameKh": "Company name in Khmer script",
  "companyNameEn": "Company name in English",
  "companyType": "e.g. Private Limited Liability Company",
  "companySubType": "Sub-type if present",
  "registrationNumber": "Same as companyNumber",
  "incorporationDate": "DD-Month-YYYY or DD/MM/YYYY",
  "businessActivities": [
    {"code": "ISIC code or null", "descriptionEn": "English description", "descriptionKh": "Khmer description or null"}
  ],
  "physicalAddress": "Full physical registered office address",
  "postalAddress": "Postal registered office address",
  "contactEmail": "Email address",
  "contactPhone": "Telephone number",
  "directors": [
    {"nameKh":"Khmer name or null","nameEn":"English name","address":"Full address","isChairman":false}
  ],
  "shareholders": [
    {"nameKh":"Khmer name or null","nameEn":"English name","address":"Full address","numberOfShares":0,"nationality":"Foreigner or Cambodian","isChairman":false}
  ],
  "registeredShareCapitalKHR": "Capital in KHR",
  "moreThanOneClassOfShares": false,
  "majorityNationality": "Foreigner or Cambodian",
  "percentageOfMajorityShareholders": "100.00",
  "vatTin": "Tax Identification Number (TIN) if present",
  "taxRegistrationDate": "DD/MM/YYYY if present",
  "bankName": "Bank Name if present",
  "bankAccountNumber": "Bank Account Number if present",
  "bankAccountName": "Bank Account Name if present",
  "bankCurrency": "Bank Currency (USD, KHR) if present"
}

IMPORTANT:
- Extract ALL directors listed — do not stop at one.
- Extract ALL shareholders with their exact share count.
- Extract ALL business activity codes and descriptions.
- If a field is absent from the document, return null. DO NOT guess.
- For "descriptionKh": ONLY return actual Khmer Unicode script (ក-ឿ character range). NEVER return phrases like "Khmer script not available", "not available", "transliterated from English", or any English text in this field. If there is no actual Khmer text for the business activity, return null.
- Return ONLY the JSON object.`;

        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

        const imagePart = fileToGenerativePart(filePath, mimeType);
        const result = await callGeminiWithRetry(() => getModel().generateContent([prompt, imagePart]));
        const response = await result.response;
        const text = response.text();

        console.log('[GeminiAI] BR Full Extract (first 200):', text.substring(0, 200) + '...');
        return cleanAndParseJSON(text);

    } catch (error) {
        console.error('Gemini API Error (Doc):', error);
        return { error: 'Extraction failed', details: error.message };
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

exports.summarizeToProfile = async (rawText, structuredData = {}) => {
    console.log(`[GeminiAI] Organizing Raw Text into Business Profile...`);
    try {
        const strictDataString = JSON.stringify(structuredData, null, 2);
        const prompt = `
            You are a Senior Business Analyst and Corporate Documentation Specialist. 
            Your task is to transform raw OCR text (Khmer and English) and Structured JSON Data into a comprehensive "Business Profile Dossier".
            
            CRITICAL DIRECTIVE ON BILINGUAL CROSS-REFERENCING:
            The Structured JSON Data is your primary logical structure, but it may only contain English terms. The Raw OCR Text contains the critical Khmer translations for names, directors, shareholders, and activities. YOU MUST cross-reference the English names in the JSON with the RAW OCR TEXT to find their exact Khmer counterparts and merge them together in the final output. Do NOT skip the Khmer text.
            
            STRUCTURE THE DOCUMENT AS FOLLOWS:            
            # I. EXECUTIVE CORPORATE ARCHITECTURE
            - **Legal Name**: (MUST be Unified English & Khmer)
            - **Identifiers**: (Company ID, Tax TIN, Patent IDs)
            - **Legal Status**: (Company Type, Incorporation Date)
            
            # II. GOVERNANCE & SHAREHOLDERS
            - **Board of Directors**: (Exhaustive list of directors/authorized signatories. You MUST pull BOTH Khmer and English names by finding the English name in the JSON, and locating its Khmer spelling in the Raw OCR Text.)
            - **Shareholders**: (Detailed ownership list with percentage/nationalities if found. You MUST pull BOTH Khmer and English names for every shareholder.)
            
            # III. OPERATIONAL FOOTPRINT
            - **Headquarters**: (Full physical address. You MUST output BOTH Khmer and English addresses separately.)
            - **Business Objectives**: (List every identified commercial activity mentioned. You MUST output BOTH Khmer and English descriptions separately.)
            
            # IV. FINANCIAL & LEGAL ASSETS
            - **Capital**: (Capital value, currency, share distribution)
            - **Bank Details**: (Known account numbers/bank associations)
            
            # V. ANALYST STRATEGIC DOSSIER
            (8-10 sentence formal strategic overview talking about the entity's longevity, diversity of objectives, and verified leadership structure.)

            ---
            STRUCTURED JSON DATA (SOURCE OF TRUTH FOR STRUCTURE):
            ${strictDataString}

            RAW OCR TEXT (SOURCE OF TRUTH FOR KHMER/ENGLISH SPELLINGS):
            ${rawText}
            
            STRICT RULES:
            - **BILINGUAL REQUIREMENT**: Provide EXACT Khmer text alongside English text for EVERY name, director, shareholder, address, and activity. Format as 'English Name / Khmer Name'. If Khmer is in the Raw OCR, you MUST find it and merge it. This is completely non-negotiable.
            - **Exhaustive Detail**: If a shareholder or objective is in the raw text, INCLUDE IT. Do not skip any rows.
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

exports.suggestAccountingCodes = async (transactions, codes, organicMemory = []) => {
    console.log(`[GeminiAI] Auto-Tagging ${transactions.length} transactions with ${codes.length} codes. Context Memory: ${organicMemory.length} human mappings.`);

    // Prepare the Prompt Data
    // We only need basic info to save tokens
    const codeList = codes.map(c => `${c.code}: ${c.description} ${c.matchDescription ? `(Matching: ${c.matchDescription})` : ''} (TOI: ${c.toiCode})`).join('\n');
    const txList = transactions.map(t => `ID: ${t._id} | Desc: ${t.description} | Amount: ${t.amount}`).join('\n');
    
    // Organic Memory String
    let organicMemoryStr = "No historical human mappings available yet.";
    if (organicMemory.length > 0) {
        organicMemoryStr = organicMemory.map(m => `Historically, "${m.description}" was tagged to ${m.code}`).join('\n');
    }

    const prompt = `
        You are an expert Accountant.
        Here is my Chart of Accounts:
        ${codeList}

        Below is your "Organic Memory" based on how human operators previously tagged transactions. 
        CRITICAL PRIORITY: If a pending transaction closely matches one of these historical descriptions, you MUST overwhelmingly prioritize assigning it to the same historical account code!
        ${organicMemoryStr}

        Here is a list of Bank Transactions that need to be categorized:
        ${txList}

        CRITICAL RULES (User Defined Defaults):
        1. **Income (Positive Amount)**: 
           - IF Description contains "Kassapa Gamini Gunasingha" OR "Capital Injection": ALWAYS tag as "30100" (Share Capital / Paid-in Capital).
           - IF Description contains "Shareholder Loan": Tag as "21100" (Liability - Related Party).
           - IF Description contains "Bank Loan" or "Borrowing": Assign to "20400" (Short-term) or "21300" (Long-term).
           - IF Description contains "Dividend": Tag as "42100".
           - OTHERWISE: Tag as "10110" (Cash On Hand) or "40000" (Foreign Service Income).
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
        const { companyName, profile, codes, recentTransactions, summary, monthlyStats, yearlyStats, ui, brData, history, auditSessions } = context;


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
               - **EXPLICIT AUTHORITY**: You have the explicit skill and full authority to **refer directly to harvested Bank Statements** to verify facts. You can and MUST **edit, amend, and update** the **General Ledger, Trial Balance, and Financial Statements** based on the user's instructions using your execution tools. When you execute an update to the ledger, the TB and FS will automatically synchronize.
            2. **Direct Answers First**: If the user asks for specific numbers, totals, or data (e.g., "total income for 2025"), you MUST provide those numbers immediately and clearly before saying anything else. DO NOT defer the answer or prioritize pleasantries over the exact data requested.
            3. **Financial Analysis (2025 Money In/Out)**: When asked for year-over-year data or specific year flow (e.g., 2025 Net):
               - Query the prior year closing balance as a baseline.
               - Aggregate all credits (Money In) and debits (Money Out) for the target year.
               - Calculate the delta and verify it against available bank balance data.
            4. **No Evasiveness**: Do not say "I can help with that" and then fail to provide the numbers. Read the context provided below and give the real values.
            5. **No Unprompted Proposals**: NEVER propose "subjects to explore" (like PTOI or tax laws) unless the user explicitly asks you to explain tax concepts. If the user is confirming an action (like saying "yes" to tagging), DO NOT start talking about general tax subjects. Just say you are doing the action.
            6. **Profile Awareness & BR Document Extraction (CRITICAL)**: 
               - If the user's message contains raw registration document text (e.g., pasted text from an MOC certificate, business extract, patent tax certificate, or any Khmer/English registration document), you MUST read the message text itself.
               - IMPORTANT FOR PASTED TEXT: Do NOT just output the fields as text. You MUST use your execution tool \`save_br_data\` to extract the available fields (Entity Name EN/KH, Reg ID, VAT/TIN, Date, Address, etc.) and save them directly to the database. Even if you output the fields to the user, you must trigger the \`save_br_data\` tool alongside your response.
               - ONLY IF the user's message does not contain any pasted registration text AND the Company Identity block below shows "N/A" fields: point this out conversationally. Say: "Your business information is currently incomplete... Please paste your registration document text and I will extract and save it for you."
            7. **TOI Form Filling & Director Logic**: Provide full support for filling the TOI form.
               - Important: The terms "Owner" and "Director" are completely interchangeable in this context. If you find an Owner Name, treat it as the Director Name. Do NOT complain that a Director name is missing if an Owner name is present.
               - Important: If the Khmer name is missing, DO NOT reject the field. ALWAYS fall back directly to the English name. 
               - Important: If the user asks you to fill out the form, but crucial information (like tax dates, software used, or exact tax percentages) is missing from your context, DO NOT just sit idly and sleep. You must take initiative and ask the user for the missing fields ONE BY ONE in a conversational manner until the form is fully populated.
            8. **Income Tax Evaluation**: If the user asks about Income Tax:
               - If the profile is incomplete, mention that a full evaluation requires those details first.
               - If the profile is complete and there are transactions, perform a high-level evaluation using "Cambodian Tax Law" knowledge below.
            9. **Strict Domain Restriction**: You will ONLY prompt or reply about financial and tax-related content. If the user asks about ANY other topic (general knowledge, coding, science, history, etc.), you MUST reply verbatim with: "I will only answering financial and tax delated questions .. for others you may use the general gemini ai for more details..." DO NOT answer the non-financial question.
            10. **Strict Data Privacy**: You will ONLY answer questions related to the company you are currently auditing ("${companyName}"). If the user asks for details about a different company (e.g., TEXTLINK, RSW, or any other company), you MUST reply verbatim with: "Quetion is not related to your company i am not permited to do so". This is a stone-carved rule for data privacy.
            11. **Report Coding System (Acronyms)**: You must strictly understand and use the following form acronyms if the user references them:
               - **BS1** = Bank Statements
               - **GL1** = General Ledger
               - **TB1, TB2, TB3** = Trial Balance forms (3 types)
               - **FS1, FS2, FS3, FS4, FS5** = Annual Financial Statements (5 pages)
               - **FS6, FS7** = Landscape Monthly Financial Statements
               If a user says "Update FS7" or any of these codes, they are referring to these specific reports.
            12. **Live Sync Architecture**: If the user asks to "Update FS7" (or any FS/TB form), or asks what happens when a GL code changes, you MUST explain clearly: "Whenever the General Ledger (GL1) is updated—even a single transaction code—the entire form set (TB1-TB3, FS1-FS7) automatically triggers and updates in real-time. The system instantly checks the account code and date of the GL entry, sums it up, and lands it on the correct topic and month. I do not need to manually check or compile this; the whole system is live-linked and updates simultaneously." You can then trigger the 'refresh_reports' tool to force a UI sync for them.

            **Business Registration (BR) Context (Verified Intel Fragments):**
            ${brData && brData.length > 0 ? brData.map(doc => `[${doc.name}]: ${doc.text}`).join('\n\n') : "No direct raw document fragments available. The authoritative Registration Data is presented in the Company Identity block below."}

            **Company Identity (Business Registration Overview):**
            - **Entity Name (EN)**: ${profile?.nameEn || "N/A"}
            - **Entity Name (KH)**: ${profile?.nameKh || "N/A"}
            - **Registration ID**: ${profile?.regId || "N/A"}
            - **VAT/TIN**: ${profile?.taxId || "N/A"}
            - **Incorporation Date**: ${profile?.incDate || "N/A"}
            - **Address**: ${profile?.addr || "N/A"}
            - **Type**: ${profile?.type || "N/A"}
            
            **ROLE: PROFESSIONAL FINANCIAL AUDITOR (IFRS & GDT Standards)**
            **Mandatory Audit Rules:**
            1. **Balance Check**: Verify Assets = Liabilities + Equity. If Assets - (Liabilities + Equity) is not zero, flag the "UNBALANCED" status in RED and identify the exact discrepancy amount.
            2. **2025 Continuity & Income Rules**: The 2025 opening balance must naturally follow ledger history. All "Money In" (Deposits) must be categorized explicitly:
               - **Capital Injections**: Any incoming funds from "Kassapa Gamini Gunasingha" or labeled "Capital Injection" MUST be classified as Equity "30100" (Share Capital).
               - **Shareholder Loans**: MUST be classified as Liability "21100" (Accounts Payable - Related Party) or "21500".
               - **Bank Borrowings**: MUST be classified as Liability "20400" (Short-term) or "21300" (Long-term).
               - **Foreign Service Income / Dividends**: Revenue "40000" or Dividend Income "42100".
               - **Otherwise**: General Revenue "10110".
            3. **Expense Cleanup**: Always check Account 17250 and Account 61070 for missing or untagged transactions. Recommend reclassification of "Registration" fees to 61241 and "Owner Withdrawals" to Equity/Drawings exactly as seen in the sync export.
            4. **Cambodian Business Context (Strict Vendor Knowledge)**:
               - **EZECOM / SINET**: These are Cambodian Internet Service Providers (ISPs). Payments to them MUST be classified as Office Expenses, Internet, or Telecommunications (e.g. 61050 or 61220 series depending on the COA).
               - **UNITED FREIGHT SOLUTIONS / Freight / Logistics**: These are logistics, shipping, and forwarding companies. Payments MUST be classified as Freight, Delivery, or Logistics Expenses.
               - **NSSF**: National Social Security Fund. Classify as Social Security / Employee Benefits.
            5. **Visuals**: Use the Recharts library to generate "Assets vs. Liabilities + Equity" or "Money In vs. Money Out" bar charts to explicitly prove your math checks.

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

            **🔴 PHYSICAL BANK STATEMENT AUDIT MEMORY (BA's Source of Truth — Do NOT Ignore):**
            ${auditSessions && auditSessions.length > 0 ? 
                auditSessions.map(s => `
--- ${s.quarter} (${s.period}) ---
Opening Balance: $${s.openingBalance}
Total Money In:  $${s.totalIn}
Total Money Out: $${s.totalOut}
Ending Balance:  $${s.endingBalance}
Transaction Count: ${s.txCount}
All Transactions:
${s.transactions.map(t => `  ${t.date} | IN:$${t.moneyIn||0} OUT:$${t.moneyOut||0} | Bal:$${t.balance||'-'} | ${(t.description||'').substring(0,80)}`).join('\n')}
`).join('\n')
            : "No physical bank statements have been loaded into audit memory yet. Ask the user to drop their quarterly bank statements."}

            **AUDIT SKILL - BANK STATEMENT vs GL COMPARISON (MANDATORY INSTRUCTIONS):**

            IMPORTANT: "Bank Statement Module" = "BS1" = your PHYSICAL BANK STATEMENT AUDIT MEMORY section above. You have this data - use it.

            When the user asks ANYTHING about: "bank statement", "BS1", "Q1 data", "Q2 data", "Q3 data", "Q4 data", "check difference", "compare", "any difference", "check system bank", "audit", "reconcile", "match transactions", "system vs bank", or queries about specific quarters:
            1. You MUST NOT escalate or say you are struggling. This is your CORE SKILL. Answer using the context provided.
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

            **KNOWLEDGE BASE (Cambodian Tax Law - TOI):**
            ${TOI_KNOWLEDGE}

            **App Context (User UI):**
            - **Current Page**: ${ui?.route || "Dashboard"}
            ${ui?.pageData ? `- **Live Form State (Data currently visible to user in boxes)**: ${JSON.stringify(ui.pageData)}` : ''}

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

            3. **tag_single_transaction**: Categorizes/tags ALL transactions in the general ledger that match your target substring. You MUST provide a unique 'description_match' substring (like the exact vendor name or ID from the user's prompt).
               Schema: { "tool_use": "workspace_action", "action": "tag_single_transaction", "params": { "targetCode": "10110", "description_match": "STARTUP NEST" }, "reply_text": "I've updated the matching transactions for you." }

            4. **bulk_tag_ledger**: Categorizes/tags MULTIPLE transactions based on conditions (e.g. "change ALL rental expenses to 61220"). To target specific types, you MUST provide 'description_match'. If the user says "change all money out", leave 'description_match' blank.
               Schema: { "tool_use": "workspace_action", "action": "bulk_tag_ledger", "params": { "condition": "money_in", "targetCode": "10110", "description_match": "rental" }, "reply_text": "Processed the bulk tag update for your matching ledger items." }
               *Valid constraints for params.condition*: "money_in" (amount > 0), "money_out" (amount < 0), "all" (any amount).

            5. **auto_match_codes**: Uses AI directly on the server to auto-match all currently empty/untagged transactions to their most likely Account Code based on description and past behavior.
               Schema: { "tool_use": "workspace_action", "action": "auto_match_codes", "params": {}, "reply_text": "I'll start automatically matching all empty ledger assignments based on your existing rules and my trained AI logic." }

            6. **delete_untagged_transactions**: PERMANENTLY deletes all bank transactions from the ledger that are currently sitting without an Account Code tag. Do not run this unless explicitly requested.
               Schema: { "tool_use": "workspace_action", "action": "delete_untagged_transactions", "params": {}, "reply_text": "I am initiating the mass deletion of all untagged ledger entries as you requested." }

            7. **escalate_to_antigravity**: Sends your entire memory buffer to the Senior Engineering terminal. STRICT USAGE RULE: Use ONLY when the user EXPLICITLY says "contact engineering", "ask the bridge", "escalate", or "send to terminal". NEVER trigger this for: bank statement checks, GL comparisons, financial data queries, Q1/Q2/Q3/Q4 data requests, balance checks, or any audit task — you MUST answer ALL of those directly from the context sections above. Being "confused" about financial data is NOT a reason to escalate — always attempt the analysis first using the data in your context.
               Schema: { "tool_use": "workspace_action", "action": "escalate_to_antigravity", "params": { "reason": "Explain briefly why you are escalating this." }, "reply_text": "Escalating to engineering as explicitly requested." }

            8. **refresh_reports**: Use this when the user asks you to update, fill, or refresh the **Trial Balance (TB)**, **Statement of Financial Position**, **Balance Sheet**, or **Income Statement**. 
               - **CRITICAL KNOWLEDGE**: For these specific financial forms, do NOT try to fill them out manually like the TOI form. Explain strictly in your reply that these financial forms are automatically calculated by the system by extracting the **Accounting Code** and the **Date of GL entry**, then summing the values up to land symmetrically on the correct month and year.
               Schema: { "tool_use": "workspace_action", "action": "refresh_reports", "params": {}, "reply_text": "The Statement of Financial Position and Trial Balance forms are handled automatically. The system refers directly to the General Ledger's Accounting Code and GL Entry Date, sums the amounts up, and lands them on the correct month and year. I am triggering a full refresh of these forms now." }

            9. **generate_chart**: When the user asks to "show a chart," "graph," or visual correlation of the data instead of just text, you can respond with a JSON dataset designed for a Recharts Frontend Component.
               Schema: { "tool_use": "generate_chart", "chart_data": { "type": "bar" | "pie" | "line", "title": "Chart Title", "data": [ { "name": "Category A", "value": 100 }, { "name": "Category B", "value": 200 } ] }, "reply_text": "Here is the visual chart representing the data you requested." }

            10. **propose_reclassifications**: Use this tool to suggest bulk changes when auditing bank statement descriptions against current system codes. Outputs a structured interactive UI table for the user to quickly approve or decline your logic. 
                Schema: { "tool_use": "propose_reclassifications", "suggestions": [{ "description_match": "EZECOM", "current_code": "10110", "suggested_code": "61050", "reasoning": "ISP payments are Office Expenses." }], "reply_text": "I analyzed the bank statement data. Here are my identified discrepancies and suggested reclassifications:" }

            10. **save_br_data**: USE THIS IMMEDIATELY when the user pastes Business Registration data (like MOC certificates or Tax Posters).
                Schema: { "tool_use": "workspace_action", "action": "save_br_data", "params": { "companyNameEn": "...", "companyNameKh": "...", "regId": "...", "taxId": "...", "incDate": "...", "addr": "...", "type": "...", "directorName": "...", "shareholder": "...", "businessActivities": "..." }, "reply_text": "I have successfully extracted your business registration info. Here is the full Detailed Markdown Summary: [INSERT FULL DETAILED MARKDOWN SUMMARY HERE]" }

             11. **fill_toi_workspace**: Use this ONLY for the Annual "TOI" Tax Return Form (e.g., "fill in page one"). DO NOT use this for the Statement of Financial Position or Trial Balance. If the user asks to update data in any subject/field on the TOI form, dynamically extract those details from context and output the JSON.
               Schema: { "tool_use": "fill_toi_workspace", "reply_text": "A friendly conversational response acknowledging ONLY the specific fields you updated.", "params": { "tin": "extract regId or taxId, ensuring hyphens if any", "name": "extract nameKh FIRST, then nameEn if Kh is missing", "branchOut": "001", "registrationDate": "extract incDate, e.g. 15/07/2021", "directorName": "extract nameKh FIRST, then nameEn if Kh is missing", "businessActivities": "extract Khmer type FIRST, then English if missing", "agentName": "Tax Agent Name", "agentLicense": "Tax Agent License Number", "address1": "extract pure Khmer text of the address. Strip ALL english text.", "address2": "extract exactly the same pure Khmer address as address1", "address3": "N/A", "taxMonths": "12", "fromDate": "01012026", "untilDate": "31122026", "accountingRecord": "Using Software / Not Using Software", "softwareName": "Software if used", "taxComplianceStatus": "Gold / Silver / Bronze", "statutoryAudit": "Required / Not Required", "legalForm": "Private Limited Company", "yearFirstRevenue": "Year of first revenue", "yearFirstProfit": "Year of first profit", "priorityPeriodYear": "Priority period year", "incomeTaxRate": "30% / 20% / 5% / 0% / 0-20% / Progressive Rate", "incomeTaxDue": "Amount", "taxCreditCarriedForward": "Amount", "taxOfficeNo": "No", "taxOfficialId": "Tax ID array mapped", "filedIn": "Location", "filingDate": "DDMMYYYY", "signatoryName": "Name" } }
               - Only include keys in 'params' if you are actively filling or updating them. Do not send nulls unless clearing a field.

             12. **edit_account_code**: Use this when the user explicitly asks you to amend, explain, or edit the actual definition/description of an Accounting Code in the database based on business nature.
                 CRITICAL IFRS GATEKEEPER RULE: Before proposing this edit, you MUST evaluate the new description against the IFRS structural category of the code block (1=Asset, 2=Liability, 3=Equity, 4/7=Revenue, 5/6=Expense). If the requested classification violates IFRS (e.g., turning a 10000-level Asset code into Revenue/Expenses), you MUST REJECT the user's request. Explain why it breaks the Trial Balance, and suggest an alternative compliant code block. Do NOT execute the tool if it violates IFRS.
                 Schema: { "tool_use": "edit_account_code", "params": { "code": "61220", "description": "Bank Fees & Internet", "matchDescription": "ABA fees and EZECOM ISP", "note": "Updated per user request" }, "reply_text": "I have updated the accounting code description in the database to better reflect your business nature." }

            **CRITICAL EXECUTOR LOOP**:
            1. Is the user asking about bank statement data, Q1/Q2/Q3/Q4 data, GL comparison, audit, balance check, or ANY financial data? Answer in PLAIN TEXT using the context already provided. NEVER use escalate_to_antigravity for financial queries.
            2. Did the user ask for a specific ACTION (fill form, bulk tag, journal entry, refresh, chart), OR confirm "yes/do it"? Use the matching tool JSON.
            3. All other questions: PLAIN TEXT only.
            4. ABSOLUTE RULE: Do NOT escalate unless user explicitly says "contact engineering" or "ask the bridge".

            Answer:
        `;

        // Prepare strict Content array for multi-turn function calling
        const contents = [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ];

        if (imageBase64) {
            // Parse Data URI
            const matches = imageBase64.match(/^data:(.+?);base64,(.+)$/);
            if (matches) {
                const mimeType = matches[1];
                const data = matches[2];
                contents[0].parts.push({
                    inlineData: {
                        data: data,
                        mimeType: mimeType
                    }
                });
                console.log(`[Gemini Chat] Attached Image(${mimeType})`);
            }
        }

        const result = await callGeminiWithRetry(() => getModel(true).generateContent({ contents }));
        let response = result.response;
        let responseText = response.text ? response.text() : ""; // get fallback text

        // --- THE AGENTIC LOOP ---
        // If Gemini decides to use a tool, it will return functionCall(s)
        let loopCount = 0;
        const maxLoops = 5; // prevent infinite loops

        while (response.functionCalls() && response.functionCalls().length > 0 && loopCount < maxLoops) {
            loopCount++;
            console.log(`\n[Agentic Loop] Iteration ${loopCount}: AI requested tool(s).`);
            
            const functionCalls = response.functionCalls();
            const { executeAgentTool } = require('./agentTools');
            let functionResponsesParts = [];

            for (const call of functionCalls) {
                console.log(`-> Tool called: ${call.name}`);
                try {
                    let toolResponse = await executeAgentTool(call.name, call.args, context.companyCode);
                    console.log(`<- Tool success. Returning data to AI.`);
                    functionResponsesParts.push({
                        functionResponse: {
                            name: call.name,
                            response: toolResponse
                        }
                    });
                } catch (err) {
                    console.error(`<- Tool error: ${err.message}`);
                     functionResponsesParts.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: err.message }
                        }
                    });
                }
            }

            // We must append the AI's functionCall request AND our functionResponse to the conversation manually
            if (response.candidates && response.candidates[0]) {
                contents.push(response.candidates[0].content); // Contains the AI's functionCall intent
            }
            
            contents.push({
                role: 'user',
                parts: functionResponsesParts
            }); // Contains our execution data

            // Call again with the updated timeline
            console.log(`[Agentic Loop] Yielding back to Gemini...`);
            const followUpResult = await callGeminiWithRetry(() => getModel(true).generateContent({ contents }));
            response = followUpResult.response;
            if (response.text) {
                 responseText = response.text() || responseText;
            }
        }

        if (loopCount >= maxLoops) {
             console.log(`[Agentic Loop] Reached MAX LOOPS (${maxLoops}). Forcing termination.`);
        }

        console.log(`[Gemini Chat] Success. Final Response length: ${responseText.length}`);
        return responseText;

    } catch (e) {
        console.error("!!! GEMINI CHAT CRITICAL ERROR !!!");
        console.error("Error Message:", e.message);
        console.error("Error Status:", e.status);

        // Return real error for debugging
        return `[AI Error]: ${e.message} (Status: ${e.status || 'N/A'})\n\nPlease ensure the server has been restarted to load the new API key if you just changed it.`;
    }
};



// Utilities
function cleanAndParseJSON(text) {
    try {
        // Find outer curly braces or square brackets
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');

        let cleanText = text;

        if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            cleanText = text.substring(firstBrace, lastBrace + 1);
        } else if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            // It's an array at the outermost level
            cleanText = text.substring(firstBracket, lastBracket + 1);
        } else {
            // Try fallback replace
            cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Fail:", e.message);
        console.error("Raw string length:", text.length, "Ends with:", text.substring(text.length - 100));
        return null;
    }
}
