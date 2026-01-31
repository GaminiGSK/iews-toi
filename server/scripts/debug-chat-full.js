require('dotenv').config({ path: './server/.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are an expert Financial AI Agent. Your job is to extract bank transaction data and tax form layouts with 100% accuracy."
});

async function testFullChat() {
    const context = {
        companyName: "Admin",
        codes: [],
        recentTransactions: [],
        summary: { balance: "0.00", income: "0.00", expense: "0.00" },
        monthlyStats: [],
        ui: { route: "Dashboard" }
    };
    const message = "tell me about Resident tax payer";

    const { companyName, codes, recentTransactions, summary, monthlyStats, ui } = context;

    const prompt = `
            You are an expert Financial Assistant for the company "${companyName}".
            You also have ADMIN privileges to create "Auto-Tagging Rules" for the General Ledger.

            **Current Financial Context:**
            - **Net Balance**: ${summary.balance}
            - **Total Income**: ${summary.income}
            - **Total Expenses**: ${summary.expense}

            **Regulatory Knowledge (Cambodia Tax Law - TOI):**
            - **Resident Natural Person**: Meeting ONE of: a) Permanent residence, b) Principal place of abode, c) In Cambodia > 182 days in any 12-month period.
            - **Non-Resident Taxpayer**: An entity established, managed, or has a principal place of business in Cambodia.
            - **Legal Entity / Limited Company**: Includes Public LLC, Private LLC, and Limited Sole Proprietorship. Also covers gov institutions, religious/charitable orgs, and Permanent Establishments.
            - **Enterprise**: An establishment or entity where a natural or legal person conducts business.
            - **Objective of TOI**: Resident taxpayer is obligated on income from Cambodian and foreign sources (World Income). Non-resident taxpayer is obligated ONLY on income from Cambodian sources.
            - **Income from Cambodian Sources**:
               * Interest and Dividends paid/shared by a resident enterprise.
               * Income from services performed in the Kingdom of Cambodia.
               * Income from management services (employee selection, training, agent management) and technical services (requires specialization/technical knowledge) paid by a resident person.
            - **Permanent Establishment (PE)**: A fixed place of business. Includes:
               * Places of management, branches, agents, offices, warehouses, factories.
               * Construction/assembly sites > 182 days.
               * Provision of services (including consulting) by employees for > 182 days in any 12-month period.
            - **PE Residency**: A PE is regarded as a RESIDENT legal entity ONLY if its income originates from Cambodia.

            **App Context (User UI):**
            - **Current Page**: ${ui?.route || "Dashboard"}
            
            **Special Instructions for "/tax-live" Route:**
            If the user is on "/tax-live", this is the "Living Tax Form Workspace".
            - If they ask "Can you see the form?" or "Can you see the workspace?", say **YES**.
            - If they say **"Yes"**, **"Go ahead"**, **"Fill it"**, or similar to one of your proposals (like filling the year or company details):
               - Output JSON: { "tool_use": "workspace_action", "action": "...", "reply_text": "Sure, I'll fill that for you now." }
               - **"fill_year"** if they agree to year filling.
               - **"fill_company"** if they agree to company details filling.

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

    try {
        console.log("Sending prompt...");
        const result = await model.generateContent([prompt]);
        console.log("Response:", result.response.text());
    } catch (e) {
        console.error("FAILED!");
        console.error("Status:", e.status);
        console.error("Message:", e.message);
    }
}

testFullChat();
