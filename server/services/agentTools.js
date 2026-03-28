const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');
const BankStatement = require('../models/BankStatement');

const agentToolsDefinitions = {
    // Defines what tools the AI models are allowed to see
    tools: [
        {
            functionDeclarations: [
                {
                    name: "query_general_ledger",
                    description: "Queries the general ledger for transactions matching specific criteria. Use this to audit matching debits/credits, or to hunt for missing records.",
                    parameters: {
                        type: "object",
                        properties: {
                            description_contains: { type: "string", description: "Filter by text in the particular/description column" },
                            account_code: { type: "string", description: "Filter by exact 5-digit account code (e.g. '10110')." },
                            minimum_amount: { type: "number", description: "Filter transactions strictly greater than or equal to this amount" },
                            maximum_amount: { type: "number", description: "Filter transactions strictly less than or equal to this amount" },
                            limit: { type: "number", description: "Max number of results to return. Default 50." }
                        }
                    }
                },
                {
                    name: "get_account_codes",
                    description: "Retrieves the current Chart of Accounts so you know which valid Account Codes exist for the user's entity.",
                    parameters: {
                        type: "object",
                        properties: {} // No arguments needed, returns all
                    }
                },
                {
                    name: "get_trial_balance_summary",
                    description: "Gets the aggregated amounts of all Assets, Liabilities, Equity, Income, and Expense accounts. Used immediately to verify $Assets = Liabilities + Equity balance status.",
                    parameters: {
                        type: "object",
                        properties: {} // No arguments needed
                    }
                },
                {
                    name: "edit_account_code",
                    description: "CRITICAL TOOL: Edits the description and AI parsing rules (matchDescription) for a specific accounting code. IFRS GATEKEEPER RULE: You MUST evaluate the user's requested new description against the fundamental IFRS category of the requested account code block (1=Asset, 2=Liability, 3=Equity, 4/7=Revenue, 5/6=Expense). If the requested classification violates IFRS (e.g., turning an Asset code into Revenue), YOU MUST REJECT the request, explain why, and suggest a compliant alternative code block.",
                    parameters: {
                        type: "object",
                        properties: {
                            code: { type: "string", description: "The strict 5-digit account code (e.g. '10110')." },
                            newDescription: { type: "string", description: "The new human-readable label for the account." },
                            newAiRules: { type: "string", description: "A comma-separated string of highly specific keywords or phrases that define what transactions belong to this code (e.g., 'Shopify payouts, Stripe deposits'). This overrides the default tagging logic." }
                        },
                        required: ["code", "newDescription", "newAiRules"]
                    }
                }
            ]
        }
    ]
};

// Tool Execution Mapping
const executeAgentTool = async (functionName, args, companyCode) => {
    switch(functionName) {
        
        case "query_general_ledger":
            console.log(`[Agent Tool Exec] query_general_ledger`, args);
            // Construct Mongo match dynamically based on the AI's requested criteria
            let match = { companyCode: companyCode };
            if (args.description_contains) {
                match.description = { $regex: args.description_contains, $options: 'i' };
            }
            if (args.minimum_amount || args.maximum_amount) {
                match.amount = {};
                if (args.minimum_amount !== undefined) match.amount.$gte = args.minimum_amount;
                if (args.maximum_amount !== undefined) match.amount.$lte = args.maximum_amount;
            }

            try {
                let query = Transaction.find(match).sort({ date: -1 });
                if (args.limit && args.limit > 0) {
                    query = query.limit(args.limit);
                } else {
                    query = query.limit(100); // hard cap so AI doesn't crash server
                }

                if (args.account_code) {
                    // Two step: get the ObjectId of the account code first, then filter tx
                    const codeDoc = await AccountCode.findOne({ companyCode: companyCode, code: args.account_code });
                    if (codeDoc) {
                        match.accountCode = codeDoc._id;
                        query = Transaction.find(match).sort({ date: -1 }).limit(args.limit || 100);
                    } else {
                        return { error: `Account Code ${args.account_code} does not exist.` };
                    }
                }

                const records = await query.populate('accountCode').lean();
                return records.map(tx => ({
                    id: tx._id,
                    date: tx.date ? tx.date.toISOString().split('T')[0] : 'No Date',
                    description: tx.description,
                    amount: tx.amount,
                    code: tx.accountCode ? tx.accountCode.code : 'Untagged'
                }));
            } catch(e) {
                return { error: "Failed to query ledger: " + e.message };
            }

        case "get_account_codes":
             console.log(`[Agent Tool Exec] get_account_codes`);
             const rawCodes = await AccountCode.find({ companyCode }).sort({ code: 1 }).lean();
             return rawCodes.map(c => ({ code: c.code, description: c.description }));
             
        case "get_trial_balance_summary":
             console.log(`[Agent Tool Exec] get_trial_balance_summary`);
             const allTransactions = await Transaction.find({ companyCode }).populate('accountCode').lean();
             
             let bankCashBalance = 0;
             let totalIncome = 0;
             let totalExpense = 0;
             const accountBalances = {}; 
             accountBalances['Implicit_Bank_Cash'] = 0;
             
             allTransactions.forEach(t => {
                const amt = t.amount || 0;
                bankCashBalance += amt;
                
                const c = t.accountCode?.code || "UNTAGGED";
                if (!accountBalances[c]) accountBalances[c] = 0;
                
                if (c.startsWith('1')) { accountBalances[c] += (-amt); }
                else { accountBalances[c] += amt; }
                
                if (amt > 0 && !c.startsWith('1') && !c.startsWith('2') && !c.startsWith('3')) {
                     totalIncome += amt;
                 } else if (amt < 0 && !c.startsWith('1') && !c.startsWith('2') && !c.startsWith('3')) {
                     totalExpense += amt;
                 }
             });
             accountBalances['Implicit_Bank_Cash'] = bankCashBalance;
             
             let recalcAssets = accountBalances['Implicit_Bank_Cash'];
             let recalcLiabilities = 0;
             let recalcEquity = totalIncome + totalExpense; // Net Income
             
             for (const [cd, bal] of Object.entries(accountBalances)) {
                 if (cd.startsWith('1')) recalcAssets += bal;
                 if (cd.startsWith('2')) recalcLiabilities += bal;
                 if (cd.startsWith('3')) recalcEquity += bal;
             }
             
             return {
                 Assets: parseFloat(recalcAssets.toFixed(2)),
                 Liabilities: parseFloat(recalcLiabilities.toFixed(2)),
                 Equity: parseFloat(recalcEquity.toFixed(2)),
                 "Is_Balanced": (recalcAssets - (recalcLiabilities + recalcEquity)) === 0,
                 "DiscrepancyAmount": parseFloat((recalcAssets - (recalcLiabilities + recalcEquity)).toFixed(2))
             };

        case "edit_account_code":
            console.log(`[Agent Tool Exec] edit_account_code`, args);
            try {
                // IFRS Logic Check as fail-safe backup backend layer (Gemini should block first)
                const firstDigit = args.code.charAt(0);
                const descUpper = args.newDescription.toUpperCase();
                
                // Extremely basic structural fail-safes
                if (firstDigit === '1' && (descUpper.includes('REVENUE') || descUpper.includes('EXPENSE'))) {
                    return { error: "IFRS Violation: Cannot set a Revenue/Expense description on a 10000-level Asset code." };
                }
                
                const updatedCode = await AccountCode.findOneAndUpdate(
                    { companyCode: companyCode, code: args.code },
                    { 
                        $set: { 
                            description: args.newDescription,
                            matchDescription: args.newAiRules,
                            updatedBy: 'human'   // Treat conversational edits as human proxy overrides
                        } 
                    },
                    { new: true }
                );
                
                if (!updatedCode) {
                    return { error: `Account Code ${args.code} not found in this company's profile. Please verify the code using get_account_codes.` };
                }
                
                return { 
                    success: true, 
                    message: `Account code ${args.code} updated successfully.`,
                    code: updatedCode.code,
                    description: updatedCode.description,
                    matchDescription: updatedCode.matchDescription
                };
            } catch (e) {
                return { error: "Failed to edit account code: " + e.message };
            }

        default:
            return { error: `Tool ${functionName} is not recognized by the system.` };
    }
};

module.exports = {
    agentToolsDefinitions,
    executeAgentTool
};
