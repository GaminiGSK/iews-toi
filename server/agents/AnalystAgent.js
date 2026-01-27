const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../models/Transaction');
const CompanyProfile = require('../models/CompanyProfile');

// Configuration
const GENAI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCL3dNr_tpKtEHH5wJUzJHq4Ydx8w_xONE";
const genAI = new GoogleGenerativeAI(GENAI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iews_toi';
        await mongoose.connect(connStr);
        console.log(`[Analyst Agent] DB Connected.`);
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
};

async function runAnalystAgent() {
    await connectDB();

    try {
        console.log(`[Analyst Agent] Waking up...`);

        // 1. Load the Semantic Schema (The Brain's Blueprint)
        const schemaPath = path.join(__dirname, 'latest_schema.json');
        if (!fs.existsSync(schemaPath)) {
            console.error("Schema not found. Run Phase 1 first.");
            return;
        }
        const schema = JSON.parse(fs.readFileSync(schemaPath)).schema;
        console.log(`[Analyst Agent] Loaded Schema with ${schema.length} semantic fields.`);

        // 2. Load the Raw Data (The Memory)
        // Get Company Profile
        const profile = await CompanyProfile.findOne().sort({ createdAt: -1 });
        // Get Summary of Transactions (e.g. Total Expenses, Payroll)
        const transactions = await Transaction.find({}); // Limit to recent?

        // Summarize Transactions for Context (Token optimization)
        const glSummary = {
            total_income: 0,
            total_expense: 0,
            payroll_expense: 0,
            entertainment_expense: 0,
            bank_charges: 0
        };

        transactions.forEach(t => {
            const amt = parseFloat(t.amount || 0);
            if (amt > 0) glSummary.total_income += amt;
            else {
                glSummary.total_expense += Math.abs(amt);
                // Simple heuristic mapping for demo (Real world needs Code mapping)
                const desc = (t.description || '').toLowerCase();
                if (desc.includes('salary') || desc.includes('payroll')) glSummary.payroll_expense += Math.abs(amt);
                if (desc.includes('party') || desc.includes('dinner')) glSummary.entertainment_expense += Math.abs(amt);
                if (desc.includes('fee') || desc.includes('charge')) glSummary.bank_charges += Math.abs(amt);
            }
        });

        const contextData = {
            company: profile || {},
            financials: glSummary,
            transaction_count: transactions.length
        };

        console.log(`[Analyst Agent] Analyzed Financial Context:`, JSON.stringify(glSummary));

        // 3. The Reasoning (Mapping Data -> Schema)
        const prompt = `
            You are the "Analyst Agent".
            
            **Goal**: Populate the "Living Form" Schema with values based on the Financial Entity's context.
            
            **Input Context**:
            ${JSON.stringify(contextData, null, 2)}
            
            **Target Schema (Fields to Fill)**:
            ${JSON.stringify(schema, null, 2)}
            
            **Instructions**:
            For each field in the Schema:
            1. Reason: Can you find this data in the Context?
            2. Logic: If the field requires calculation (e.g. Total Employees), estimate or use 0.
            3. Value: The final value to write.
            
            **Dynamic Mutation**:
            If you see "Entertainment Expense" is high ($${glSummary.entertainment_expense.toFixed(2)}), and the Schema allows adjustments, note that in the reasoning.
            
            Return a JSON Object:
            {
                "filled_fields": [
                    { "id": "...", "value": "...", "reasoning": "..." }
                ]
            }
            JSON Only.
        `;

        console.log(`[Analyst Agent] Reasoning over Data...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let filledData;
        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            filledData = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse Agent Output", text);
            return;
        }

        // 4. Output Result
        const outputPath = path.join(__dirname, 'filled_form_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(filledData, null, 2));

        console.log(`[Analyst Agent] Thought Process Complete.`);
        console.log(`[Analyst Agent] Form Population Plan saved to: ${outputPath}`);
        console.log(`[Analyst Agent] Sample Decisions:`);
        console.log(JSON.stringify(filledData.filled_fields.slice(0, 3), null, 2));

    } catch (err) {
        console.error("Analyst Agent Failed:", err);
    } finally {
        mongoose.disconnect();
    }
}

runAnalystAgent();
