const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const googleAI = require('../services/googleAI');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');
const User = require('../models/User');

// POST /api/chat/message
router.post('/message', auth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Message is required" });

        // 1. Fetch Context Data
        const companyCode = req.user.companyCode;

        // Fetch Company Name (Optional, derived from User or generic)
        const user = await User.findById(req.user.id);
        const companyName = user.companyName || companyCode;

        // Fetch recent transactions (Limit 15 for context)
        const transactions = await Transaction.find({ companyCode })
            .sort({ date: -1 }) // Newest first
            .limit(15);

        // Fetch Chart of Accounts
        const rawCodes = await AccountCode.find({ companyCode }).sort({ code: 1 });
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
            date: t.date.toISOString().split('T')[0],
            description: t.description,
            amount: t.amount,
            code: t.accountCode
        }));

        // 2. Call AI Service
        const context = {
            companyName,
            codes,
            recentTransactions: recentTxContext,
            summary,
            monthlyStats
        };

        const aiResponse = await googleAI.chatWithFinancialAgent(message, context);

        // 3. Return Response
        res.json({ text: aiResponse });

    } catch (err) {
        console.error("Chat API Error:", err);
        res.status(500).json({ message: "Server error processing chat request" });
    }
});

module.exports = router;
