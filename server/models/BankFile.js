const mongoose = require('mongoose');

const BankFileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true },

    // File Metadata
    originalName: { type: String, required: true },
    driveId: { type: String }, // Google Drive ID (or local path)
    mimeType: { type: String },
    size: { type: Number },

    // Extracted Info
    dateRange: { type: String }, // e.g. "Jan 01 - Jan 31 2024"
    transactionCount: { type: Number, default: 0 },
    status: { type: String, default: 'Processed' }, // Processing, Processed, Error

    uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('BankFile', BankFileSchema);
