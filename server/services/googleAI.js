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
    console.log(`[GeminiAI] Processing Document: ${filePath} (Type: ${docType})`);
    try {
        let prompt = "";

        switch (docType) {
            case 'moc_cert':
                prompt = "Extract from MOC Certificate (JSON): companyNameEn, companyNameKh, registrationNumber, oldRegistrationNumber, incorporationDate (DD/MM/YYYY), companyType (e.g. Sole Proprietorship, PLC), address.";
                break;
            case 'kh_extract':
            case 'en_extract':
                prompt = "Extract from Business Extract (JSON): companyNameEn, registrationNumber, businessActivity, directorName, capitalAmount.";
                break;
            case 'tax_patent':
            case 'tax_id':
                prompt = "Extract from Tax/VAT Certificate (JSON): vatTin, companyNameKh, taxRegistrationDate.";
                break;
            case 'bank_opening':
                prompt = "Extract from Bank Account Letter (JSON): bankName, bankAccountNumber, bankAccountName, bankCurrency.";
                break;
            default:
                prompt = "Extract all visible business details from this image as JSON: companyNameEn, companyNameKh, registrationNumber, address, vatTin.";
        }

        prompt += " Return ONLY raw JSON, no markdown.";

        // Vision Model supports JPEG/PNG directly
        const imagePart = fileToGenerativePart(filePath, "image/jpeg");

        const result = await getModel().generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return cleanAndParseJSON(text);
    } catch (error) {
        console.error("Gemini API Error (Doc):", error);
        return { rawText: "Error extracting data." };
    }
};

exports.extractBankStatement = async (filePath) => {
    console.log(`[GeminiAI] Scanning Bank Statement (Vision 2.0): ${filePath}`);

    try {
        // AGENTIC PROMPT: STAGE 1 (Layout) & STAGE 2 (Structure)
        const prompt = `
            Analyze this Bank Statement image visually.
            1. **Layout Detection**: Locate the main "Account Activity" or "Transaction History" table. Ignore headers/footers outside the table.
            2. **Data Extraction**: Extract every single row from the table into a JSON Array.
            
            JSON Schema:
            [
            JSON Schema:
            [
              {
                "date": "DD-MMM-YYYY", // CRITICAL: Return format like "01-Jul-2025". Use English Month Abbr.
                "description": "Full verbatim description text. Do NOT summarize. Include REF#, Time, Remarks, and all details.",
                "moneyIn": 0.00, // Number. If empty/dash, use 0.
                "moneyOut": 0.00, // Number. If empty/dash, use 0.
                "balance": "0.00" // String representation of the balance column
              }
            ]

            Rules:
            - **CRITICAL**: Look for the 'Statement Date', 'Period', or 'Date' header at the top of the image to determine the correct YEAR. 
            - If the transaction rows only show 'DD MMM' (e.g. 15 Feb), use the YEAR found in the header. 
            - Do NOT default to the current year unless no year is found in the entire document.
            - Look strictly at the columns. Don't hallucinate data.
            - If "Money In" and "Money Out" are in one column (Signed), separate them based on sign (- is Out).
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
        const data = cleanAndParseJSON(text);

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("[GeminiAI] Output Invalid/Empty. Raw:", text.substring(0, 100));
            // DEBUG FALLBACK: Return the raw text as a transaction so user can see it
            return [{
                date: "DEBUG_ERR",
                description: "AI Parse Failed. Raw Output: " + text.substring(0, 200).replace(/\n/g, ' '),
                moneyIn: 0,
                moneyOut: 0,
                balance: "0.00"
            }];
        }

        // AGENTIC STAGE 3: LOGICAL VALIDATION (Math Check)
        // We can optionally verify here, or just mark them for the UI.
        // For now, we return the raw data and let the UI handle display.
        // We could calculate a 'verified' flag if needed.

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

        // Construct a context-aware prompt
        const prompt = `
            You are an expert Financial Assistant for the company "${companyName}".
            You also have ADMIN privileges to create "Auto-Tagging Rules" for the General Ledger.

            **Company Identity (MOC/Tax Profile):**
            - **Entity Name (EN)**: ${profile?.nameEn || "N/A"}
            - **Entity Name (KH)**: ${profile?.nameKh || "N/A"}
            - **Registration ID**: ${profile?.regId || "N/A"}
            - **VAT/TIN**: ${profile?.taxId || "N/A"}
            - **Incorporation Date**: ${profile?.incDate || "N/A"}
            - **Address**: ${profile?.addr || "N/A"}

            **Current Financial Context:**
            - **Net Balance**: ${summary.balance}
            - **Total Income**: ${summary.income}
            - **Total Expenses**: ${summary.expense}

            **KNOWLEDGE BASE (Cambodian Tax Law - TOI):**
            ${TOI_KNOWLEDGE}

            **Additional Regulatory Context:**
            - **Legal Entity / Limited Company**: Includes Public LLC, Private LLC, and Limited Sole Proprietorship.
            - **PE Residency**: A PE is regarded as a RESIDENT legal entity ONLY if its income originates from Cambodia.
            
            **App Context (User UI):**
            - **Current Page**: ${ui?.route || "Dashboard"}

            **Special Instructions for "/tax-live" Route:**
            If the user is on "/tax-live", this is the "Living Tax Form Workspace".
            - If they ask "Can you see the form?" or "Can you see the workspace?", say **YES**.
            - If they say **"Yes"**, **"Go ahead"**, **"Fill it"**, or similar to one of your proposals:
               - Output JSON: { "tool_use": "workspace_action", "action": "...", "reply_text": "Sure, I'll fill that for you now." }
               - **"fill_year"** if they agree to year filling.

             **Chart of Accounts (Top 50):**
            ${codes.map(c => `- ${c.code} (${c.description})`).slice(0, 50).join('\n')}

            **User Query:** "${message}"

            **Instructions:**
            1. **DETECT RULE REQUESTS**: If the user asks to "set a rule", "always tag", "categorize X as Y", or "change the limit", you MUST process this as a Rule Creation Request.
               - Output JSON: { "tool_use": "create_rule", "rule_data": { ... }, "reply_text": "..." }

            2. **DETECT WORKSPACE ACTIONS**: If you are in tax-live and the user agrees to a fill action:
               - Output JSON: { "tool_use": "workspace_action", "action": "fill_year" OR "fill_company", "reply_text": "..." }

            3. **DETECT ADJUSTMENT REQUESTS**: If the user asks to "depreciate assets", "accrue expenses", "adjust the books", or "manual entry":
               - Output JSON: { "tool_use": "propose_journal_entry", "journal_data": { ... }, "reply_text": "..." }
               
            4. **IMAGE ANALYSIS**: If an image is provided, analyze the visual content (receipt, invoice, document) and extract relevant numbers or descriptions in your answer.

            5. **NORMAL CHAT**: If it is NOT a rule/action request, answer normally in plain text.
               - Be professional, concise, and helpful.
               - Use Markdown for formatting (bold, lists).

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
                console.log(`[Gemini Chat] Attached Image (${mimeType})`);
            }
        }

        const result = await getModel().generateContent(inputs);
        const responseText = result.response.text();
        console.log(`[Gemini Chat] Success. Response length: ${responseText.length}`);
        return responseText;

    } catch (e) {
        console.error("!!! GEMINI CHAT CRITICAL ERROR !!!");
        console.error("Error Message:", e.message);
        console.error("Error Status:", e.status);

        // Return real error for debugging
        return `[AI Error]: ${e.message}. (Status: ${e.status || 'N/A'})\n\nPlease ensure the server has been restarted to load the new API key if you just changed it.`;
    }
};


exports.analyzeTaxForm = async (filePath) => {
    console.log(`[GeminiAI] Analyzing Tax Form Layout: ${filePath}`);
    try {
        // Use standard model (not forced JSON mode) for better reasoning on Layout
        const apiKey = getApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const visionModel = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: "You are a professional Document Archeologist. You are excellent at finding OCR fields and their pixel coordinates."
        });

        const prompt = `
            Analyze this Cambodian TOI Tax Form. 
            Identify every single white box, digit-strip (TIN), or checkbox. 
            
            YOU MUST FIND AT LEAST 20 FIELDS.
            Focus on:
            1. Fiscal Year (4 boxes at top right)
            2. Tax Period (top left)
            3. TIN (1. Tax Identification Number) - 9 digit squares
            4. Enterpise Details (2, 3, 4, 5, 8, 9, 10 - Name, Phone, Email, Address)
            5. Business Activities (6, 7)
            6. Checkboxes (11, 12, 13, 14)
            7. Amounts (Table columns 15, 16, 17)

            For each field, provide:
            - label: Title of the field.
            - x, y, w, h: Percentage coordinates (0 to 100).
            - type: "text" or "checkbox".

            Reply ONLY with a JSON object:
            {
                "fields": [ { "label": "...", "x": ..., "y": ..., "w": ..., "h": ..., "type": "..." }, ... ],
                "rawText": "Harvest all text you see here."
            }
        `;

        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

        const filePart = fileToGenerativePart(filePath, mimeType);

        const result = await visionModel.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();

        console.log("[GeminiAI] Raw Layout Analysis Output (Full Text):", text);

        const data = cleanAndParseJSON(text);

        if (!data) throw new Error("AI returned unparseable output.");

        // Handle various JSON shapes from Gemini
        const mappings = data.fields || data.mappings || (Array.isArray(data) ? data : []);
        const rawText = data.rawText || data.text || "Summary available in mappings.";

        console.log(`[GeminiAI] Detected ${mappings.length} fields and harvested text.`);
        return { mappings, rawText };

    } catch (e) {
        console.error("Gemini Tax Analysis Error:", e);
        return { mappings: [], rawText: "Error during analysis." };
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

