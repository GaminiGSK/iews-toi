const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const googleAI = require('../services/googleAI');
const ollamaAI = require('../services/ollamaAI');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const BankStatement = require('../models/BankStatement');
const Bridge = require('../models/Bridge');

// POST /api/chat/message
router.post('/message', auth, async (req, res) => {
    try {
        const { message, image, model, context: chatContext } = req.body;
        if (!message && !image) return res.status(400).json({ message: "Message or Image is required" });

        // 1. Fetch Context Data (with Admin Entity Override)
        let userId = req.user.id;
        let companyCode = req.user.companyCode;
        let targetUsername = chatContext?.targetUsername;

        // If Admin is querying a target entity, switch context source
        if (req.user.role === 'admin' && targetUsername) {
            const targetUser = await User.findOne({ username: { $regex: new RegExp(`^${targetUsername.trim()}$`, 'i') } });
            if (targetUser) {
                userId = targetUser._id;
                companyCode = targetUser.companyCode;
            }
        }

        // Fetch Company Profile (Source of Truth for Entity Info)
        const profile = await CompanyProfile.findOne({ user: userId }).lean() || {};

        // Fetch Company Name (Fallback)
        const user = await User.findById(userId);
        const companyName = profile.companyNameEn || (user ? user.companyName : null) || companyCode;

        // Fetch ALL transactions to calculate accurate Balance Sheet (Assets, Liabilities, Equity)
        // and sort by newest first for recent transactions context
        const allTransactions = await Transaction.find({ companyCode })
            .sort({ date: -1 }) // Newest first
            .populate('accountCode')
            .lean();

        let bankCashBalance = 0;
        allTransactions.forEach(t => bankCashBalance += (t.amount || 0));

        let totalAssets = bankCashBalance;
        let totalLiabilities = 0;
        let totalEquity = 0;
        let totalIncome = 0;
        let totalExpense = 0;
        const accountBalances = {}; // Track precise totals per account code

        // Also expose the raw implicitly tracked Bank account in the trial balance so AI sees it
        accountBalances['Implicit_Bank_Cash'] = bankCashBalance;

        allTransactions.forEach(t => {
            const code = t.accountCode?.code || "UNTAGGED";
            const amount = t.amount || 0;

            if (!accountBalances[code]) accountBalances[code] = 0;

            // Single-entry accounting correction: 
            // Assets (like fixed assets or cash on hand) increase when bank cash is spent (so amount is negative).
            // Hence their standard positive value is the inverse of the cash flow.
            if (code.startsWith('1')) {
                accountBalances[code] += (-amount);
            }
            // Liabilities/Equity normal balances align with bank cash inflows (+amount -> liability grows)
            else if (code.startsWith('2')) {
                accountBalances[code] += amount;
            }
            else if (code.startsWith('3')) {
                accountBalances[code] += amount;
            }
            else {
                accountBalances[code] += amount;
            }

            // Income / Expense tracking
            if (amount > 0 && !code.startsWith('1') && !code.startsWith('2') && !code.startsWith('3')) {
                totalIncome += amount;
            } else if (amount < 0 && !code.startsWith('1') && !code.startsWith('2') && !code.startsWith('3')) {
                totalExpense += amount; // expenses are negative natively
            }
        });

        // Add Retained Earnings (Net Income) into Equity to balance the ledger
        const netIncome = totalIncome + totalExpense;
        accountBalances['Net Income'] = netIncome;

        let recalcAssets = accountBalances['Implicit_Bank_Cash'];
        let recalcLiabilities = 0;
        let recalcEquity = netIncome;

        for (const [code, bal] of Object.entries(accountBalances)) {
            if (code.startsWith('1')) recalcAssets += bal;
            if (code.startsWith('2')) recalcLiabilities += bal;
            if (code.startsWith('3')) recalcEquity += bal;
        }

        const summaryStats = [{
            totalIncome,
            totalExpense,
            totalAssets: recalcAssets,
            totalLiabilities: recalcLiabilities,
            totalEquity: recalcEquity
        }];

        // Calculate Monthly Trends (Last 36 Months)
        const monthlyStatsRaw = await Transaction.aggregate([
            { $match: { companyCode: companyCode } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                    income: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } }
                }
            },
            { $sort: { _id: -1 } }, // Newest first
            { $limit: 36 },
            { $sort: { _id: 1 } }   // Restore chronological order
        ]);

        // Calculate Yearly Trends
        const yearlyStatsRaw = await Transaction.aggregate([
            { $match: { companyCode: companyCode } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y", date: "$date" } },
                    income: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 5 }
        ]);

        const monthlyStats = monthlyStatsRaw.map(m => ({
            month: m._id,
            income: m.income.toFixed(2),
            expense: m.expense.toFixed(2),
            net: (m.income + m.expense).toFixed(2)
        }));

        const yearlyStats = yearlyStatsRaw.map(y => ({
            year: y._id,
            income: y.income.toFixed(2),
            expense: y.expense.toFixed(2),
            net: (y.income + y.expense).toFixed(2)
        }));

        const summary = {
            balance: summaryStats[0] ? (summaryStats[0].totalIncome + summaryStats[0].totalExpense).toFixed(2) : "0.00",
            income: summaryStats[0] ? summaryStats[0].totalIncome.toFixed(2) : "0.00",
            expense: summaryStats[0] ? summaryStats[0].totalExpense.toFixed(2) : "0.00",
            assets: summaryStats[0] ? summaryStats[0].totalAssets.toFixed(2) : "0.00",
            liabilities: summaryStats[0] ? summaryStats[0].totalLiabilities.toFixed(2) : "0.00",
            equity: summaryStats[0] ? summaryStats[0].totalEquity.toFixed(2) : "0.00"
        };

        const recentTxContext = allTransactions.slice(0, 500).map(t => ({
            date: t.date ? t.date.toISOString().split('T')[0] : 'No Date',
            description: t.description,
            amount: t.amount,
            code: t.accountCode ? t.accountCode.code : 'Uncategorized'
        }));

        // Fetch Chart of Accounts
        const rawCodes = await AccountCode.find({ companyCode }).sort({ code: 1 }).lean();
        const codes = rawCodes.map(c => ({ code: c.code, description: c.description }));

        // Fetch recent harvested Bank Statements (V2 Model)
        const bankStatements = await BankStatement.find({ companyCode })
            .sort({ createdAt: -1 })
            .limit(2)
            .lean();

        let harvestedBankContext = bankStatements.map(bs => ({
            bankName: bs.bankName || 'Unknown Bank',
            accountNumber: bs.accountNumber || '',
            dateRange: `${bs.dateRangeStart || 'Unknown'} to ${bs.dateRangeEnd || 'Unknown'}`,
            transactions: (bs.transactions || []).slice(0, 50).map(tx => ({
                date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'N/A',
                desc: tx.description || '',
                in: tx.moneyIn || 0,
                out: tx.moneyOut || 0
            }))
        }));

        // Fallback: If no V2 statements, try to pull metadata from old V1 BankFile models to satisfy AI prompts
        if (harvestedBankContext.length === 0) {
            const mongoose = require('mongoose');
            const oldBankFiles = await mongoose.connection.db.collection('bankfiles').find({ companyCode }).sort({ uploadedAt: -1 }).limit(2).toArray();

            if (oldBankFiles.length > 0) {
                // Fetch the transactions associated with these old files to give context
                for (const oldFile of oldBankFiles) {
                    const txs = await mongoose.connection.db.collection('transactions').find({ companyCode, originalData: { $exists: true } }).limit(20).toArray(); // Very rough heuristic for V1

                    harvestedBankContext.push({
                        bankName: "Harvested Document",
                        accountNumber: "Original File: " + oldFile.originalName,
                        dateRange: oldFile.dateRange || 'Unknown',
                        transactions: txs.map(tx => ({
                            date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'N/A',
                            desc: tx.description || '',
                            in: tx.amount > 0 ? tx.amount : 0,
                            out: tx.amount < 0 ? Math.abs(tx.amount) : 0
                        }))
                    });
                }
            }
        }

        // 2. Call AI Service (Route based on model selection)
        const context = {
            companyName,
            profile: {
                nameEn: profile.companyNameEn,
                nameKh: profile.companyNameKh,
                regId: profile.registrationNumber,
                taxId: profile.vatTin,
                incDate: profile.incorporationDate,
                type: profile.companyType,
                addr: profile.address
            },
            codes,
            recentTransactions: recentTxContext,
            accountBalances, /* NEW: Full Trial Balance Aggregation */
            harvestedBankStatements: harvestedBankContext,
            summary,
            monthlyStats,
            yearlyStats,
            ui: req.body.context || {}, // Pass UI Context (Route, etc.)
            brData: req.body.context?.brData || [], // Explicitly pass BR harvested data
            history: req.body.history || [] // Pass conversation history
        };

        let aiResponse = "";
        const isOllama = model && (model.includes('ollama') || model.includes('deepseek') || model.includes('gpt-oss'));

        if (isOllama) {
            // Mapping friendly names to local model IDs
            let modelId = "deepseek-v3.1:671b-cloud"; // Default for Ollama
            if (model.includes('coder')) modelId = "deepseek-coder-v2:16b-lite-instruct-q4_K_M";
            if (model.includes('gpt-oss')) modelId = "deepseek-coder-v2:16b-lite-instruct-q4_K_M"; // Map GPT-OSS to local coder for now

            aiResponse = await ollamaAI.chatWithOllamaAgent(message || "Analyzing local context...", context, image, modelId);
        } else {
            // Default to Gemini (Cloud) - and handle Claude labels as Gemini for this prototype
            aiResponse = await googleAI.chatWithFinancialAgent(message || "Analyze this image", context, image);
        }

        // 3. Handle Potential Tool Use (Rule Creation)
        let finalText = aiResponse;
        let toolAction = null;


        try {
            // Advanced JSON extraction for model robustness
            const jsonMatch = aiResponse.match(/\{[\s\S]*"tool_use"[\s\S]*\}/);
            if (jsonMatch) {
                const cleanJson = jsonMatch[0];
                const toolPayload = JSON.parse(cleanJson);

                // --- INJECT SECURE CONTEXT ---
                // Overwrite frontend params with the authorized/impersonated backend context
                if (!toolPayload.params) toolPayload.params = {};
                toolPayload.params.companyCode = companyCode;

                toolAction = toolPayload;
                finalText = toolPayload.reply_text || "Suggestion received.";

                if (toolPayload.tool_use === 'create_rule') {
                    const ruleData = toolPayload.rule_data;
                    if (ruleData.targetAccountCode && ruleData.criteria) {
                        const ClassificationRule = require('../models/ClassificationRule');
                        const existingRule = await ClassificationRule.findOne({
                            companyCode,
                            ruleType: ruleData.ruleType,
                            criteria: ruleData.criteria
                        });
                        if (existingRule) {
                            existingRule.targetAccountCode = ruleData.targetAccountCode;
                            existingRule.name = ruleData.name;
                            await existingRule.save();
                            finalText = `Use Updated Rule: ${toolPayload.reply_text}`;
                        } else {
                            await ClassificationRule.create({
                                companyCode,
                                name: ruleData.name,
                                ruleType: ruleData.ruleType,
                                criteria: ruleData.criteria,
                                operator: ruleData.operator || 'contains',
                                targetAccountCode: ruleData.targetAccountCode,
                                priority: 8
                            });
                            finalText = toolPayload.reply_text;
                        }
                    } else {
                        finalText = "I understood you want to create a rule, but I couldn't identify the specific code or criteria. Please try again.";
                    }
                }
            }
        } catch (e) {
            // Not JSON or parse error, just return raw text
        }

        // --- 4. Live Log for Antigravity Debugging ---
        try {
            await Bridge.create({
                type: 'live_chat_log',
                source: `User:${req.user.username} | Comp:${companyCode}`,
                content: {
                    userQuery: message,
                    aiResponse: finalText,
                    toolAction: toolAction,
                    timestamp: new Date()
                }
            });
        } catch (logErr) {
            console.error("Failed to write to Live Chat Log:", logErr);
        }

        // 5. Return Response
        res.json({ text: finalText, toolAction });

    } catch (err) {
        console.error("Chat API Error:", err);
        // Return the error as a chat message so the user sees it
        res.json({ text: `⚠️ System Error: ${err.message || 'Unknown error occurred in AI service.'}` });
    }
});

module.exports = router;
