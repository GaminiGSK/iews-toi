const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// USER PROVIDED KEY
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCL3dNr_tpKtEHH5wJUzJHq4Ydx8w_xONE";

const genAI = new GoogleGenerativeAI(API_KEY);
// Downgrade to Gemini 1.0 Pro (Standard Free Tier) to avoid 403 Forbidden on Flash
// UPDATE: User confirmed Key supports 'gemini-2.0-flash-exp' (Vision)
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: "You are an expert Financial AI Agent. Your job is to extract bank transaction data with 100% accuracy from images."
});

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

        const result = await model.generateContent([prompt, imagePart]);
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

        const result = await model.generateContent([prompt, filePart]);
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
        As an expert accountant, provide a brief, comma-separated list of 3-5 typical bank transaction descriptions that would correspond to the General Ledger account: "${code} - ${description}".
        Example for "Utilities": "Electricity bill payment, Water extraction fee, Internet service charge"
        Return ONLY the comma-separated string. No quotes, no markdown.
    `;
    try {
        const result = await model.generateContent(prompt);
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
        const result = await model.generateContent(prompt);
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

exports.chatWithFinancialAgent = async (message, context) => {
    try {
        const { companyName, codes, recentTransactions, summary, monthlyStats } = context;

        // Construct a context-aware prompt
        const prompt = `
            You are an expert Financial Assistant for the company "${companyName}".
            
            **Current Financial Context:**
            - **Net Balance**: ${summary.balance}
            - **Total Income**: ${summary.income}
            - **Total Expenses**: ${summary.expense}

            **Monthly Trends (Last 12 Months):**
            ${monthlyStats ? monthlyStats.map(m => `- ${m.month}: Income ${m.income}, Expense ${m.expense}, Net ${m.net}`).join('\n') : 'No monthly data available.'}

            **Chart of Accounts (Top 50):**
            ${codes.map(c => `- ${c.code} (${c.description})`).slice(0, 50).join('\n')}

            **Recent Transactions (Last 10):**
            ${recentTransactions.map(t => `- [${t.date}] ${t.description} : ${t.amount} (Code: ${t.code || 'Uncategorized'})`).join('\n')}

            **User Query:** "${message}"

            **Instructions:**
            1. Answer the user's question accurately based on the data provided.
            2. If asking about specific transactions not listed here, say you only have access to the most recent ones.
            3. Be professional, concise, and helpful.
            4. If the user asks for financial advice, give a disclaimer.
            5. Use Markdown for formatting (bold, lists).

            Answer:
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();

    } catch (e) {
        console.error("Gemini Chat Error:", e);
        return "I apologize, but I am having trouble processing your request right now. Please try again later.";
    }
};

// Utilities
function cleanAndParseJSON(text) {
    try {
        // 1. Attempt strict clean
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Regex fallback: Find the first '[' and last ']' to ignore preamble
        const match = clean.match(/\[[\s\S]*\]/);
        if (match) {
            clean = match[0];
        }

        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Fail. Raw extract:", text.substring(0, 100));
        return null;
    }
}

