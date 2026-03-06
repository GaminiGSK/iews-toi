const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    date: Date,
    description: String,
    reference: String,
    moneyIn: Number,
    moneyOut: Number,
    balance: Number,
    accountCode: String,
    code: String,
    sequence: Number
});

const BankStatementSchema = new mongoose.Schema({
    companyCode: { type: String, required: true },
    originalName: { type: String, required: true },
    path: String,
    driveId: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bankName: String,
    accountNumber: String,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    transactions: [TransactionSchema],
    isSticked: { type: Boolean, default: false },
    status: { type: String, default: 'Draft' },
    driveFolderId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BankStatement', BankStatementSchema);
