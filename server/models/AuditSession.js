const mongoose = require('mongoose');

// Stores parsed bank statement data for BA Auditor sessions.
// This gives BA permanent memory of the physical bank statements across chat sessions.
const AuditSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true },
    quarter: { type: String }, // e.g. 'Q1-2025', 'Q2-2025'
    statementPeriod: { type: String }, // e.g. 'Jan 01, 2025 - Mar 31, 2025'
    parsedAt: { type: Date, default: Date.now },

    // Summary from bank statement cover page
    openingBalance: { type: Number },
    totalMoneyIn: { type: Number },
    totalMoneyOut: { type: Number },
    endingBalance: { type: Number },
    accountNumber: { type: String },
    bankName: { type: String },

    // Full transaction list as extracted from the PDF pages
    transactions: [{
        date: { type: String },       // e.g. '2025-02-10'
        description: { type: String },
        moneyIn: { type: Number, default: 0 },
        moneyOut: { type: Number, default: 0 },
        balance: { type: Number }
    }],

    // BA's audit notes and discrepancies found during this session
    auditFindings: [{ type: String }],

    // Raw Gemini extraction text for reference
    rawExtraction: { type: String }

}, { timestamps: true });

// Index for quick lookup
AuditSessionSchema.index({ companyCode: 1, quarter: 1 });

module.exports = mongoose.model('AuditSession', AuditSessionSchema);
