const mongoose = require('mongoose');

class AgentExecutor {
    constructor(io) {
        this.io = io;
    }

    async execute(socket, action, packageId, params) {
        console.log(`[AgentExecutor] Routing action: ${action}`);
        try {
            switch (action) {
                // Tax Form Workflows
                case 'fill_year':
                    const TaxAgent = require('../agents/TaxAgent');
                    await TaxAgent.fillFiscalContext(socket, packageId, params.year);
                    break;
                case 'fill_company':
                    const TaxAgentComp = require('../agents/TaxAgent');
                    await TaxAgentComp.fillCompanyDetails(socket, packageId, params.companyCode);
                    break;
                case 'trigger_analysis':
                    console.log(`[Admin] AI requested analysis trigger for ${packageId}`);
                    this.io.emit('admin:trigger_analysis', { packageId });
                    break;

                // Ledger Workflows
                case 'bulk_tag_ledger':
                    await this.bulkTagLedger(socket, params);
                    break;

                case 'auto_match_codes':
                    await this.autoMatchCodes(socket, params);
                    break;

                case 'delete_untagged_transactions':
                    await this.deleteUntaggedTransactions(socket, params);
                    break;

                default:
                    console.log(`[AgentExecutor] Unknown action: ${action}`);
                    socket.emit('agent:message', { text: `Sorry, I don't know how to perform the action: ${action}` });
            }
        } catch (error) {
            console.error(`[AgentExecutor] Error executing ${action}:`, error);
            socket.emit('agent:message', { text: `An error occurred while trying to perform the requested action.` });
        }
    }

    async bulkTagLedger(socket, params) {
        const { companyCode, condition, targetCode } = params;
        console.log(`[AgentExecutor] Bulk tagging ledger for ${companyCode} to ${targetCode} (Condition: ${condition})`);

        const Transaction = require('../models/Transaction');
        const AccountCode = require('../models/AccountCode');

        const targetCodeObj = await AccountCode.findOne({ companyCode: companyCode, code: targetCode });
        if (targetCodeObj) {
            const query = { companyCode: companyCode };
            if (condition === 'money_in') query.amount = { $gt: 0 };
            else if (condition === 'money_out') query.amount = { $lt: 0 };
            // if 'all', just leave the query as { companyCode }

            const result = await Transaction.updateMany(query, { accountCode: targetCodeObj._id, tagSource: 'ai' });
            console.log(`[AgentExecutor] Tagged ${result.modifiedCount} transactions.`);

            socket.emit('agent:message', {
                text: `Successfully updated ${result.modifiedCount} transactions to ${targetCode} (${targetCodeObj.description}).`
            });
            socket.emit('ledger:updated');
        } else {
            socket.emit('agent:message', { text: `Failed to tag. Code ${targetCode} not found in your Chart of Accounts.` });
        }
    }

    async autoMatchCodes(socket, params) {
        const { companyCode } = params;
        socket.emit('agent:message', { text: "Starting AI auto-matching for your untagged transactions... This might take a moment." });

        const Transaction = require('../models/Transaction');
        const AccountCode = require('../models/AccountCode');
        const googleAI = require('./googleAI');

        const untagged = await Transaction.find({ companyCode: companyCode, accountCode: { $exists: false } }).limit(50);
        if (untagged.length === 0) {
            socket.emit('agent:message', { text: "Good news, there are no untagged transactions to process!" });
            return;
        }

        const codes = await AccountCode.find({ companyCode: companyCode }).lean();
        if (codes.length === 0) {
            socket.emit('agent:message', { text: "I can't auto-match because there are no Account Codes defined for your Chart of Accounts." });
            return;
        }

        const suggestions = await googleAI.suggestAccountingCodes(untagged, codes);
        let count = 0;

        for (const sugg of suggestions) {
            if (sugg.transactionId && sugg.accountCode) {
                const ac = codes.find(c => c.code === sugg.accountCode);
                if (ac) {
                    await Transaction.findByIdAndUpdate(sugg.transactionId, { accountCode: ac._id, tagSource: 'ai' });
                    count++;
                }
            }
        }

        socket.emit('agent:message', { text: `AI Auto-Tagging Complete! Successfully tagged ${count} transactions.` });
        socket.emit('ledger:updated');
    }

    async deleteUntaggedTransactions(socket, params) {
        const { companyCode } = params;
        socket.emit('agent:message', { text: "Deleting untagged transactions..." });

        const Transaction = require('../models/Transaction');

        const result = await Transaction.deleteMany({ companyCode: companyCode, accountCode: { $exists: false } });

        socket.emit('agent:message', { text: `Successfully deleted ${result.deletedCount} untagged transactions from your ledger.` });
        socket.emit('ledger:updated');
    }
}

module.exports = AgentExecutor;
