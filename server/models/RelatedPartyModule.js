const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    txType:       { type: String }, // 'Sales','Purchase','Loan Given','Loan Received','Mgmt Fee','Royalty','Dividend','Guarantee'
    partyName:    { type: String },
    amount:       { type: Number, default: 0 },
    description:  { type: String },
    armLength:    { type: String, default: 'yes' }, // 'yes'|'no'
    armLengthNote:{ type: String },
}, { _id: false });

const DirectorLoanSchema = new mongoose.Schema({
    direction:    { type: String }, // 'To Director','From Director','To Shareholder','From Shareholder'
    partyName:    { type: String },
    openingBal:   { type: Number, default: 0 },
    newLoans:     { type: Number, default: 0 },
    repayments:   { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    interestAmt:  { type: Number, default: 0 },
}, { _id: false });

const DividendSchema = new mongoose.Schema({
    shareholderName: { type: String },
    pct:             { type: Number, default: 0 },
    amount:          { type: Number, default: 0 },
    dateDeclared:    { type: String },
    datePaid:        { type: String },
}, { _id: false });

const RelatedPartyModuleSchema = new mongoose.Schema({
    companyCode:      { type: String, required: true, unique: true },
    // Section A — Setup questions
    hasParent:        { type: String, default: 'no' },
    hasSubsidiary:    { type: String, default: 'no' },
    hasTransactions:  { type: String, default: 'no' },
    hasDirectorLoans: { type: String, default: 'no' },
    hasMgmtFees:      { type: String, default: 'no' },
    hasRoyalties:     { type: String, default: 'no' },
    hasDividends:     { type: String, default: 'no' },
    // Section B — Related parties list
    parties: [{
        name:         { type: String },
        relationship: { type: String }, // 'Director','Shareholder','Parent','Subsidiary','Associate','Other'
        nationality:  { type: String },
        ownershipPct: { type: Number, default: 0 },
        country:      { type: String },
    }],
    // Section C — Transactions
    transactions: [TransactionSchema],
    // Section D — Director loans
    directorLoans: [DirectorLoanSchema],
    // Section E — Dividends
    dividends: [DividendSchema],
    // Document uploads
    uploads: [{
        label:      { type: String },
        fileName:   { type: String },
        mimeType:   { type: String },
        data:       { type: String },  // base64
        uploadedAt: { type: Date, default: Date.now }
    }],
    lastSaved:  { type: Date },
    savedBy:    { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RelatedPartyModule', RelatedPartyModuleSchema);
