const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    companyCode: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true }, // USD or KHR
    transactionId: { type: String }, // Bank's ID
    category: { type: String }, // GL Category
    originalData: { type: Object } // Store raw mapped data just in case
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
