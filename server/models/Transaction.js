const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyCode: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    amount: { type: Number, required: true }, // Positive for Money In, Negative for Money Out
    balance: { type: Number }, // Snapshot balance from statement
    currency: { type: String, required: true, default: 'USD' },
    transactionId: { type: String }, // Bank's ID or Unique Ref
    category: { type: String }, // GL Category
    accountCode: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountCode' }, // Link to Chart of Accounts
    sequence: { type: Number, default: 0 }, // For ordering same-day transactions
    originalData: { type: Object } // Store raw mapped data just in case
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
