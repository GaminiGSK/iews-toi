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
const AuditSession = require('../models/AuditSession');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

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

        const recentTxContext = allTransactions.slice(0, 5).map(t => ({
            date: t.date ? t.date.toISOString().split('T')[0] : 'No Date',
            description: t.description,
            amount: t.amount,
            code: t.accountCode ? t.accountCode.code : 'Uncategorized'
        }));

        // Fetch Chart of Accounts
        const rawCodes = await AccountCode.find({ companyCode }).sort({ code: 1 }).lean();
        const codes = rawCodes.map(c => ({ code: c.code, description: c.description }));

        // PHASE 1: Zero-State Lazy Loading. Only fetch heavy Bank/Audit data if relevant
        let harvestedBankContext = [];
        let auditSessions = [];
        const msgLower = (message || '').toLowerCase();
        const wantsBankData = msgLower.includes('bank') || msgLower.includes('statement') || msgLower.includes('upload') || msgLower.includes('audit') || image;

        if (wantsBankData) {
            // Fetch recent harvested Bank Statements (V2 Model)
            const bankStatements = await BankStatement.find({ companyCode })
                .sort({ createdAt: -1 })
                .limit(2)
                .lean();

            harvestedBankContext = bankStatements.map(bs => ({
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
                    for (const oldFile of oldBankFiles) {
                        const txs = await mongoose.connection.db.collection('transactions').find({ companyCode, originalData: { $exists: true } }).limit(20).toArray();

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

            // Fetch stored audit sessions
            auditSessions = await AuditSession.find({ companyCode })
                .sort({ parsedAt: -1 })
                .limit(8)
                .lean();
        }

        let backendBrData = [];
        if (profile.documents && Array.isArray(profile.documents)) {
            backendBrData = profile.documents
                .filter(doc => doc.rawText)
                .map(doc => ({
                    name: doc.originalName || doc.docType || 'Document',
                    text: doc.rawText
                }));
        }

        const context = {
            companyCode,
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
            // Persistent audit sessions from physical bank statement drops
            auditSessions: auditSessions.map(s => ({
                quarter: s.quarter,
                period: s.statementPeriod,
                openingBalance: s.openingBalance,
                totalIn: s.totalMoneyIn,
                totalOut: s.totalMoneyOut,
                endingBalance: s.endingBalance,
                txCount: s.transactions.length,
                transactions: s.transactions // Full transaction list
            })),
            summary,
            monthlyStats,
            yearlyStats,
            ui: req.body.context || {}, // Pass UI Context (Route, etc.)
            brData: backendBrData, // SECURITY: Only use server-side profile docs, never client-sent data
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

                // --- NORMALIZE AI MISTAKES ---
                if (toolPayload.action && toolPayload.tool_use !== 'workspace_action' && toolPayload.tool_use !== 'propose_journal_entry' && toolPayload.tool_use !== 'generate_chart' && toolPayload.tool_use !== 'fill_toi_workspace' && toolPayload.tool_use !== 'edit_account_code') {
                    // Force it to a workspace action so the frontend processor runs it
                    toolPayload.tool_use = 'workspace_action';
                }

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

                // --- EDIT ACCOUNT CODE DEFINITION ---
                if (toolPayload.tool_use === 'edit_account_code') {
                    const codeUpdates = toolPayload.params;
                    if (codeUpdates && codeUpdates.code) {
                        const existingCode = await AccountCode.findOne({ companyCode, code: codeUpdates.code });
                        if (existingCode) {
                            if (codeUpdates.description) existingCode.description = codeUpdates.description;
                            if (codeUpdates.note !== undefined) existingCode.note = codeUpdates.note;
                            if (codeUpdates.matchDescription !== undefined) existingCode.matchDescription = codeUpdates.matchDescription;
                            existingCode.updatedBy = 'human'; 
                            await existingCode.save();
                            finalText = `Successfully updated Accounting Code ${codeUpdates.code} to: ${existingCode.description}`;
                            console.log(`[BA Audit] Updated accounting code ${codeUpdates.code} for ${companyCode}`);
                        } else {
                            finalText = `Error: Accounting Code ${codeUpdates.code} not found in your Chart of Accounts.`;
                        }
                    } else {
                        finalText = "I need the account code number to edit it. Please try again.";
                    }
                }

                // --- PERSIST TOI SETTINGS ---
                if (toolPayload.tool_use === 'fill_toi_workspace' && toolPayload.params) {
                    const profileRec = await CompanyProfile.findOne({ companyCode });
                    if (profileRec) {
                        if (!profileRec.extractedData) profileRec.extractedData = new Map();
                        
                        Object.keys(toolPayload.params).forEach(k => {
                            const val = toolPayload.params[k];
                            if (val !== null && val !== "" && val !== "N/A") {
                                profileRec.extractedData.set(k, String(val));
                            }
                        });
                        profileRec.markModified('extractedData');
                        await profileRec.save();
                        console.log(`[BA Audit] Persisted TOI workspace settings to DB for ${companyCode}:`, Object.keys(toolPayload.params));
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

// ============================================================
// POST /api/chat/parse-bank-statement
// BA Auditor File Drop — reads ONLY the transactions visible
// on the DROPPED PAGE. Appends page by page to AuditSession.
// Does NOT invent data. Does NOT compare against cover totals.
// ============================================================
router.post('/parse-bank-statement', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const companyCode = req.user.companyCode;
        const userId = req.user.id;
        const filePath = req.file.path;
        const quarter = req.body.quarter || null; // Optional: 'Q1-2025', etc.

        console.log(`[BA Audit] Parsing bank statement: ${req.file.originalname} for ${companyCode}`);

        // Use Gemini Vision with a BA-specific audit extraction prompt
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = req.file.mimetype;

        // CRITICAL: Only extract transactions physically visible on this page.
        // The cover/summary box shows FULL QUARTER totals — do not use those as transaction data.
        const prompt = `You are a bank statement page parser. Read ONLY what is physically on this specific image/page.

YOUR JOB:
1. If this page has an ACCOUNT SUMMARY box (Opening Balance, Total Money In, Total Money Out, Ending Balance) — extract those as the expected quarter totals.
2. Extract ONLY the transaction rows in the ACCOUNT ACTIVITY table on THIS page. Do not invent, estimate, or fabricate transactions not visually present.
3. If this is a continuation page (no summary box), set openingBalance/totalMoneyIn/totalMoneyOut/endingBalance to null.

Return ONLY valid JSON:
{
  "statementPeriod": "Jan 01, 2025 - Mar 31, 2025",
  "accountNumber": "003 102 780",
  "bankName": "ABA Bank",
  "openingBalance": 49.08,
  "totalMoneyIn": 16490.05,
  "totalMoneyOut": 12360.00,
  "endingBalance": 4179.13,
  "pageTransactions": [
    {
      "date": "2025-02-10",
      "description": "Exact verbatim text from the row",
      "moneyIn": 10700.00,
      "moneyOut": 0,
      "balance": 10749.08
    }
  ]
}

STRICT RULES:
- pageTransactions = ONLY rows physically in the ACCOUNT ACTIVITY table on this exact page
- Do NOT add transactions from the summary/cover section
- Do NOT guess what is on other pages
- Use YYYY-MM-DD for dates
- moneyIn = 0 for withdrawal rows, moneyOut = 0 for deposit rows
- Fields not on this page = null
- Return ONLY raw JSON, no markdown`;

        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { data: fileBuffer.toString('base64'), mimeType } }
        ]);

        const rawText = result.response.text();
        console.log(`[BA Audit] Raw extraction length: ${rawText.length}`);

        // Parse the extracted JSON
        let parsed = null;
        try {
            const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
        } catch (pe) {
            console.error('[BA Audit] JSON parse error:', pe.message);
        }

        if (!parsed) {
            try { fs.unlinkSync(filePath); } catch(e) {}
            return res.status(422).json({ error: 'Could not parse this page. Please ensure file is clear and readable.' });
        }

        // Use pageTransactions (strict page-only) or fall back to transactions key
        const pageTxs = parsed.pageTransactions || parsed.transactions || [];
        console.log(`[BA Audit] Transactions on this page: ${pageTxs.length}`);

        // Determine quarter label from period if not provided
        let quarterLabel = quarter;
        if (!quarterLabel && parsed.statementPeriod) {
            const p = parsed.statementPeriod.toLowerCase();
            const yearMatch = p.match(/(\d{4})/);
            const yr = yearMatch ? yearMatch[1] : new Date().getFullYear();
            if (p.includes('jan') || p.includes('feb') || p.includes('mar')) quarterLabel = `Q1-${yr}`;
            else if (p.includes('apr') || p.includes('may') || p.includes('jun')) quarterLabel = `Q2-${yr}`;
            else if (p.includes('jul') || p.includes('aug') || p.includes('sep')) quarterLabel = `Q3-${yr}`;
            else if (p.includes('oct') || p.includes('nov') || p.includes('dec')) quarterLabel = `Q4-${yr}`;
            else quarterLabel = `Unknown-${yr}`;
        }

        // Only update quarter-level summary if this page has those fields (cover page).
        // Never overwrite existing good data with nulls.
        const summaryUpdate = {};
        if (parsed.statementPeriod) summaryUpdate.statementPeriod = parsed.statementPeriod;
        if (parsed.bankName) summaryUpdate.bankName = parsed.bankName;
        if (parsed.accountNumber) summaryUpdate.accountNumber = parsed.accountNumber;
        if (parsed.openingBalance != null) summaryUpdate.openingBalance = parsed.openingBalance;
        if (parsed.totalMoneyIn != null) summaryUpdate.totalMoneyIn = parsed.totalMoneyIn;
        if (parsed.totalMoneyOut != null) summaryUpdate.totalMoneyOut = parsed.totalMoneyOut;
        if (parsed.endingBalance != null) summaryUpdate.endingBalance = parsed.endingBalance;

        let existingSession = await AuditSession.findOne({ companyCode, quarter: quarterLabel });

        if (existingSession) {
            // APPEND new transactions — deduplicate by date+amounts
            const existingKeys = new Set(
                existingSession.transactions.map(t => `${t.date}|${t.moneyIn}|${t.moneyOut}`)
            );
            const newTxs = pageTxs.filter(t => !existingKeys.has(`${t.date}|${t.moneyIn}|${t.moneyOut}`));
            existingSession.transactions.push(...newTxs);
            Object.assign(existingSession, summaryUpdate);
            existingSession.parsedAt = new Date();
            await existingSession.save();
        } else {
            await AuditSession.create({
                user: userId, companyCode, quarter: quarterLabel,
                transactions: pageTxs,
                rawExtraction: rawText.substring(0, 2000),
                parsedAt: new Date(),
                ...summaryUpdate
            });
        }

        // Clean up temp file
        try { fs.unlinkSync(filePath); } catch(e) {}

        // Reload accumulated session state
        const session = await AuditSession.findOne({ companyCode, quarter: quarterLabel });
        const allTxs = session.transactions;
        const totalAccIn = allTxs.reduce((s, t) => s + (parseFloat(t.moneyIn) || 0), 0);
        const totalAccOut = allTxs.reduce((s, t) => s + (parseFloat(t.moneyOut) || 0), 0);
        const lastTx = allTxs[allTxs.length - 1];
        const lastBalance = lastTx ? (parseFloat(lastTx.balance) || null) : null;
        const quarterComplete = session.endingBalance != null && lastBalance != null &&
            Math.abs(lastBalance - session.endingBalance) < 0.02;

        res.json({
            success: true,
            quarter: quarterLabel,
            period: session.statementPeriod,
            thisPageTransactions: pageTxs.length,
            totalTransactionsSoFar: allTxs.length,
            lastBalance,
            quarterComplete,
            expectedSummary: {
                openingBalance: session.openingBalance,
                totalMoneyIn: session.totalMoneyIn,
                totalMoneyOut: session.totalMoneyOut,
                endingBalance: session.endingBalance
            },
            accumulatedActual: {
                totalIn: totalAccIn.toFixed(2),
                totalOut: totalAccOut.toFixed(2),
                lastBalance
            }
        });

    } catch (err) {
        console.error('[BA Audit] Parse error:', err);
        res.status(500).json({ error: 'Failed to process bank statement: ' + err.message });
    }
});

module.exports = router;
