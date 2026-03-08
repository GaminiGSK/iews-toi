const express = require('express');
const router = express.Router();
const Bridge = require('../models/Bridge');
const Transaction = require('../models/Transaction');
const AccountCode = require('../models/AccountCode');
const BankStatement = require('../models/BankStatement');
const TaxTemplate = require('../models/TaxTemplate');
const TaxPackage = require('../models/TaxPackage');

// POST data to the bridge (External calls this)
router.post('/send', async (req, res) => {
    try {
        const { source, type, content, secret } = req.body;
        if (process.env.BRIDGE_SECRET && secret !== process.env.BRIDGE_SECRET) {
            return res.status(401).json({ message: 'Unauthorized bridge access' });
        }
        const bridgeEntry = new Bridge({ source, type, content });
        await bridgeEntry.save();
        res.json({ message: 'Data bridged successfully', id: bridgeEntry._id });
    } catch (err) {
        res.status(500).json({ message: 'Bridge failure' });
    }
});

// GET unread bridge entries (Antigravity calls this)
router.get('/unread', async (req, res) => {
    try {
        const secret = req.headers['x-bridge-secret'];
        if (process.env.BRIDGE_SECRET && secret !== process.env.BRIDGE_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const entries = await Bridge.find({ status: 'unread' }).sort({ createdAt: 1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch' });
    }
});

// GET latest bridge entries (External calls this to see status updates)
router.get('/latest', async (req, res) => {
    try {
        const secret = req.headers['x-bridge-secret'];
        if (process.env.BRIDGE_SECRET && secret !== process.env.BRIDGE_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const entries = await Bridge.find().sort({ createdAt: -1 }).limit(10);
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch latest' });
    }
});

// Mark entry as acknowledged
router.post('/acknowledge/:id', async (req, res) => {
    try {
        await Bridge.findByIdAndUpdate(req.params.id, { status: 'acknowledged' });
        res.json({ message: 'Acknowledged' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

// External AI Sync Data Link
router.post('/sync', async (req, res) => {
    try {
        const { action, scope, standard } = req.body;

        if (action === 'AUDIT_REQUEST') {
            const companyCode = 'GK_SMART_AI';

            let responseData = {
                metadata: {
                    company: companyCode,
                    standard: standard || 'IFRS',
                    timestamp: new Date().toISOString()
                },
                data: {}
            };

            if (scope && scope.includes('GeneralLedger')) {
                const allTransactions = await Transaction.find({ companyCode }).populate('accountCode').lean();
                let bankCashBalance = 0;
                const accountBalances = {};

                allTransactions.forEach(t => bankCashBalance += (t.amount || 0));
                accountBalances['Implicit_Bank_Cash'] = bankCashBalance;

                allTransactions.forEach(t => {
                    const codeLabel = t.accountCode ? `${t.accountCode.code} - ${t.accountCode.description}` : (t.code || "UNTAGGED");
                    if (!accountBalances[codeLabel]) accountBalances[codeLabel] = 0;

                    const codeStr = t.accountCode ? t.accountCode.code.toString() : (t.code || "");

                    // Single-entry equation math representation
                    if (codeStr.startsWith('1')) {
                        accountBalances[codeLabel] += -(t.amount || 0);
                    } else {
                        accountBalances[codeLabel] += (t.amount || 0);
                    }
                });

                responseData.data.GeneralLedger = accountBalances;
            }

            if (scope && scope.includes('TransactionLogs')) {
                const allTransactions = await Transaction.find({ companyCode }).populate('accountCode').sort({ date: -1 }).limit(600).lean();
                responseData.data.TransactionLogs = allTransactions.map(t => ({
                    date: t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A',
                    description: t.description,
                    amount: t.amount,
                    account: t.accountCode ? `${t.accountCode.code} - ${t.accountCode.description}` : t.code
                }));
            }

            if (scope && scope.includes('BankStatements_2025')) {
                const banks = await BankStatement.find({ companyCode }).lean();
                responseData.data.BankStatements = banks;
            }

            if (scope && scope.includes('TOI_Templates')) {
                const templates = await TaxTemplate.find({}).lean();
                responseData.data.ToiTemplates = templates;
            }

            if (scope && scope.includes('TOI_Feed')) {
                const packages = await TaxPackage.find({}).lean();
                responseData.data.ToiPackages = packages;
            }

            return res.json(responseData);
        }

        return res.status(400).json({ error: 'Unsupported bridging action' });

    } catch (err) {
        console.error("Sync link failure:", err);
        res.status(500).json({ message: 'Sync link failure', error: err.message });
    }
});

module.exports = router;
