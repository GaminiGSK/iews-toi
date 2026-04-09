const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

class AgentExecutor {
    constructor(io) {
        this.io = io;
    }

    // Returns the companyCode from the socket's JWT — TRUSTED source, not client params
    _getAuthenticatedCompanyCode(socket) {
        try {
            const token = socket.handshake?.auth?.token || socket.handshake?.headers?.authorization?.split(' ')[1];
            if (!token) return null;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.companyCode || null;
        } catch (e) {
            console.warn('[AgentExecutor] JWT decode failed:', e.message);
            return null;
        }
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
                case 'tag_single_transaction':
                    await this.tagSingleTransaction(socket, params);
                    break;
                case 'bulk_tag_ledger':
                    await this.bulkTagLedger(socket, params);
                    break;
                case 'tag_rate_type':
                    await this.tagRateType(socket, params);
                    break;

                case 'auto_match_codes':
                    await this.autoMatchCodes(socket, params);
                    break;

                case 'delete_untagged_transactions':
                    await this.deleteUntaggedTransactions(socket, params);
                    break;

                case 'escalate_to_antigravity':
                    await this.escalateToAntigravity(socket, params);
                    break;

                case 'refresh_reports':
                    console.log(`[AgentExecutor] AI triggered manual refresh of all reports for ${params.companyCode || 'user'}.`);
                    socket.emit('ledger:updated');
                    break;

                case 'save_br_data':
                    await this.saveBrData(socket, params);
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

    async saveBrData(socket, params) {
        const companyCode = this._getAuthenticatedCompanyCode(socket) || params.companyCode;
        console.log(`[AgentExecutor] Saving BR Data for ${companyCode}`, params);
        
        try {
            const CompanyProfile = require('../models/CompanyProfile');
            const User = require('../models/User');
            
            // Find the user to get their user ID (company profiles are linked by user ID)
            const user = await User.findOne({ companyCode });
            if (!user) {
                socket.emit('agent:message', { text: "Error: Could not find user account to link profile data." });
                return;
            }

            // Map extracted properties to profile schema
            const updateData = {};
            if (params.companyNameEn) updateData.companyNameEn = params.companyNameEn;
            if (params.companyNameKh) updateData.companyNameKh = params.companyNameKh;
            if (params.regId) updateData.registrationNumber = params.regId;
            if (params.taxId) updateData.vatTin = params.taxId;
            if (params.incDate) updateData.incorporationDate = params.incDate;
            if (params.addr) updateData.address = params.addr;
            if (params.type) updateData.companyType = params.type;
            
            // For directors/business activities we'd normally put them in extractedData or specific arrays
            updateData['extractedData.directorName'] = params.directorName || params.director || '';
            updateData['extractedData.businessActivities'] = params.businessActivities || '';
            
            // Also update top-level schema fields for legacy compatibility
            if (params.directorName || params.director) updateData.director = params.directorName || params.director;
            if (params.shareholder) updateData.shareholder = params.shareholder;

            await CompanyProfile.findOneAndUpdate(
                { user: user._id },
                { $set: updateData },
                { upsert: true, new: true }
            );

            socket.emit('agent:message', { text: "I have successfully extracted and saved your business registration data to your profile. The Company Identity block will now reflect this new data." });
            // Optionally, tell the client to refresh the profile if it's listening
            socket.emit('profile:updated'); 
        } catch (e) {
            console.error('[AgentExecutor] saveBrData Error:', e);
            socket.emit('agent:message', { text: "Error saving BR data: " + e.message });
        }
    }

    async bulkTagLedger(socket, params) {
        // SECURITY: Always use server-side JWT companyCode, not client-sent param
        const trustedCompanyCode = this._getAuthenticatedCompanyCode(socket) || params.companyCode;
        const { condition, targetCode, description_match } = params;
        const companyCode = trustedCompanyCode;
        console.log(`[AgentExecutor] Bulk tagging ledger for ${companyCode} to ${targetCode} (Condition: ${condition})`);

        const Transaction = require('../models/Transaction');
        const AccountCode = require('../models/AccountCode');

        let targetCodeObj = await AccountCode.findOne({ companyCode: companyCode, code: targetCode });
        
        // AI Fallback: If AI sent the description instead of the code number, try to match by description
        if (!targetCodeObj && targetCode && targetCode.length > 0) {
            targetCodeObj = await AccountCode.findOne({
                companyCode: companyCode,
                $or: [
                    { description: { $regex: new RegExp(targetCode.trim(), 'i') } },
                    { matchDescription: { $regex: new RegExp(targetCode.trim(), 'i') } }
                ]
            });
        }
        if (targetCodeObj) {
            const query = { companyCode: companyCode };
            
            // Safety Lock: only block if there is NO direction filter (condition='all') AND no description keyword
            // Commands like "all money in to capital" already have a direction filter — safe without a keyword.
            // Only truly dangerous: condition='all' + empty description = would reclassify EVERY transaction.
            const isUndirected = condition !== 'money_in' && condition !== 'money_out';
            if (isUndirected && (!description_match || description_match.trim().length === 0)) {
                socket.emit('agent:message', { text: `Safety Lock: I cannot reclassify ALL transactions with no filter at all — that would change everything. Please say "all money in" or "all money out" to limit by direction, or give me a description keyword.` });
                return;
            }

            if (condition === 'money_in') query.amount = { $gt: 0 };
            else if (condition === 'money_out') query.amount = { $lt: 0 };
            // if 'all', just leave the query as { companyCode }

            if (description_match) {
                const escaped = description_match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.description = { $regex: new RegExp(escaped, 'i') };
            }

            const result = await Transaction.updateMany(query, { 
                accountCode: targetCodeObj._id, 
                code: targetCodeObj.code, 
                tagSource: 'ai' 
            });
            console.log(`[AgentExecutor] Tagged ${result.modifiedCount} transactions.`);

            socket.emit('agent:message', {
                text: `Successfully updated ${result.modifiedCount} transactions to ${targetCode} (${targetCodeObj.description}).`
            });
            socket.emit('ledger:updated');
        } else {
            socket.emit('agent:message', { text: `Failed to tag. Code ${targetCode} not found in your Chart of Accounts.` });
        }
    }

    async tagSingleTransaction(socket, params) {
        const trustedCompanyCode = this._getAuthenticatedCompanyCode(socket) || params.companyCode;
        const { targetCode, description_match } = params;
        
        if (!description_match || description_match.length < 3) {
            socket.emit('agent:message', { text: `I need a specific vendor name or keyword to identify the exact transaction.` });
            return;
        }

        const Transaction = require('../models/Transaction');
        const AccountCode = require('../models/AccountCode');

        let targetCodeObj = await AccountCode.findOne({ companyCode: trustedCompanyCode, code: targetCode });
        
        if (!targetCodeObj && targetCode) {
            targetCodeObj = await AccountCode.findOne({
                companyCode: trustedCompanyCode,
                $or: [
                    { description: { $regex: new RegExp(targetCode.trim(), 'i') } },
                    { matchDescription: { $regex: new RegExp(targetCode.trim(), 'i') } }
                ]
            });
        }

        if (targetCodeObj) {
            // Find ALL transactions to tag
            const escapedMatch = description_match.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const query = { 
                companyCode: trustedCompanyCode,
                description: { $regex: new RegExp(escapedMatch, 'i') }
            };
            
            // Find one first to report back accurately
            const targetTxs = await Transaction.find(query);
            
            if (targetTxs.length === 0) {
                socket.emit('agent:message', { text: `I couldn't find any transaction matching "${description_match}" in your ledger.` });
                return;
            }

            const result = await Transaction.updateMany(query, {
                accountCode: targetCodeObj._id,
                code: targetCodeObj.code,
                tagSource: 'ai'
            });

            socket.emit('agent:message', {
                text: `I surgically tagged ${result.modifiedCount || targetTxs.length} transaction(s) matching "${description_match}" to ${targetCodeObj.code} (${targetCodeObj.description}).`
            });
            socket.emit('ledger:updated');
        } else {
            socket.emit('agent:message', { text: `Failed to tag. Code ${targetCode} not found in your Chart of Accounts.` });
        }
    }

    async autoMatchCodes(socket, params) {
        // SECURITY: Use JWT companyCode — not client-sent param
        const companyCode = this._getAuthenticatedCompanyCode(socket) || params.companyCode;
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
                    await Transaction.findByIdAndUpdate(sugg.transactionId, { 
                        accountCode: ac._id, 
                        code: ac.code, 
                        tagSource: 'ai' 
                    });
                    count++;
                }
            }
        }

        socket.emit('agent:message', { text: `AI Auto-Tagging Complete! Successfully tagged ${count} transactions.` });
        socket.emit('ledger:updated');
    }

    async tagRateType(socket, params) {
        const trustedCompanyCode = this._getAuthenticatedCompanyCode(socket) || params.companyCode;
        const { rateType, description_match } = params;

        const validRates = ['BE', 'ME', 'GE', 'IE', ''];
        if (!validRates.includes(rateType)) {
            socket.emit('agent:message', { text: `Invalid rate type "${rateType}". Must be BE, ME, GE, or IE.` });
            return;
        }

        const Transaction = require('../models/Transaction');
        const query = { companyCode: trustedCompanyCode };

        if (description_match && description_match.trim().length > 0) {
            const escaped = description_match.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.description = { $regex: new RegExp(escaped, 'i') };
        } else {
            // Safety: require at least something to narrow the scope
            socket.emit('agent:message', { text: `Please tell me which transactions to tag with ${rateType} rate (e.g. a vendor name or keyword).` });
            return;
        }

        const count = await Transaction.countDocuments(query);
        if (count === 0) {
            socket.emit('agent:message', { text: `No transactions found matching "${description_match}".` });
            return;
        }

        await Transaction.updateMany(query, { rateType: rateType });

        const rateLabels = { BE: 'Bank Exchange', ME: 'Market Exchange', GE: 'GDT Exchange', IE: 'Internal Exchange' };
        socket.emit('agent:message', {
            text: `✅ Tagged ${count} transaction(s) matching "${description_match}" with ${rateType} (${rateLabels[rateType] || rateType}) exchange rate. KHR values will recalculate on reload.`
        });
        socket.emit('ledger:updated');
    }

    async deleteUntaggedTransactions(socket, params) {
        // SECURITY: Use JWT companyCode — not client-sent param
        const companyCode = this._getAuthenticatedCompanyCode(socket) || params.companyCode;
        socket.emit('agent:message', { text: "Deleting untagged transactions..." });

        const Transaction = require('../models/Transaction');

        const result = await Transaction.deleteMany({ companyCode: companyCode, accountCode: { $exists: false } });

        socket.emit('agent:message', { text: `Successfully deleted ${result.deletedCount} untagged transactions from your ledger.` });
        socket.emit('ledger:updated');
    }
    async escalateToAntigravity(socket, params) {
        const { companyCode, reason, history } = params;

        console.log(`[AgentExecutor] Escalating to Antigravity. Reason: ${reason}`);

        try {
            const Bridge = require('../models/Bridge');
            const newEscalation = new Bridge({
                type: 'escalation',
                source: 'Blue Agent (' + (companyCode || 'Unknown') + ')',
                content: {
                    reason: reason || 'AI encountered an execution error or user request for engineering assistance.',
                    companyCode: companyCode,
                    historyCapture: history || 'History not provided by client.',
                    timestamp: new Date().toISOString()
                }
            });
            await newEscalation.save();

            socket.emit('agent:message', {
                text: "Priority transmission sent. The Antigravity Engineer has received my memory logs and is reviewing the situation. The administrator can check the terminal."
            });
        } catch (e) {
            console.error("Failed to commit escalation to Bridge:", e);
            socket.emit('agent:message', { text: "Failed to connect to the Antigravity secure line. I'm on my own for now." });
        }
    }
}

module.exports = AgentExecutor;
