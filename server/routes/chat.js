const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const googleAI = require('../services/googleAI');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');

// POST /api/chat/message
router.post('/message', auth, async (req, res) => {
    try {
        const { message, image } = req.body;
        if (!message && !image) return res.status(400).json({ message: "Message or Image is required" });

        // 1. Fetch Context Data
        const companyCode = req.user.companyCode;

        // Fetch Company Profile (Source of Truth for Entity Info)
        const profile = await CompanyProfile.findOne({ user: req.user.id }).lean() || {};

        // Fetch Company Name (Fallback)
        const user = await User.findById(req.user.id);
        const companyName = profile.companyNameEn || user.companyName || companyCode;

        // Fetch recent transactions (Limit 15 for context)
        const transactions = await Transaction.find({ companyCode })
            .sort({ date: -1 }) // Newest first
            .limit(15)
            .populate('accountCode')
            .lean();

        // Fetch Chart of Accounts
        const rawCodes = await AccountCode.find({ companyCode }).sort({ code: 1 }).lean();
        const codes = rawCodes.map(c => ({ code: c.code, description: c.description }));

        // Calculate a quick Financial Summary (All time or YTD?)
        // Let's do a simple aggregation for Total Income/Expense
        const summaryStats = await Transaction.aggregate([
            { $match: { companyCode: companyCode } },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] }
                    },
                    totalExpense: {
                        $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] }
                    }
                }
            }
        ]);

        // Calculate Monthly Trends (Last 12 Months)
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
            { $limit: 12 },
            { $sort: { _id: 1 } }   // Restore chronological order
        ]);

        const monthlyStats = monthlyStatsRaw.map(m => ({
            month: m._id,
            income: m.income.toFixed(2),
            expense: m.expense.toFixed(2),
            net: (m.income + m.expense).toFixed(2)
        }));

        const summary = {
            balance: summaryStats[0] ? (summaryStats[0].totalIncome + summaryStats[0].totalExpense).toFixed(2) : "0.00",
            income: summaryStats[0] ? summaryStats[0].totalIncome.toFixed(2) : "0.00",
            expense: summaryStats[0] ? summaryStats[0].totalExpense.toFixed(2) : "0.00"
        };

        const recentTxContext = transactions.map(t => ({
            date: t.date ? t.date.toISOString().split('T')[0] : 'No Date',
            description: t.description,
            amount: t.amount,
            code: t.accountCode ? t.accountCode.code : 'Uncategorized'
        }));

        // 2. Call AI Service
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
            summary,
            monthlyStats,
            ui: req.body.context || {} // Pass UI Context (Route, etc.)
        };

        // Pass 'image' (Base64) to the AI service
        const aiResponse = await googleAI.chatWithFinancialAgent(message || "Analyze this image", context, image);

        // 3. Handle Potential Tool Use (Rule Creation)
        let finalText = aiResponse;
        let toolAction = null;

        try {
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            if (cleanJson.startsWith('{') && cleanJson.includes('"tool_use"')) {
                const toolPayload = JSON.parse(cleanJson);
                toolAction = toolPayload;
                finalText = toolPayload.reply_text; // Default reply

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

        // 4. Return Response
        res.json({ text: finalText, toolAction });

    } catch (err) {
        console.error("Chat API Error:", err);
        // Return the error as a chat message so the user sees it
        res.json({ text: `⚠️ System Error: ${err.message || 'Unknown error occurred in AI service.'}` });
    }
});

module.exports = router;
