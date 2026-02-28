const mongoose = require('mongoose');

const BankFileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyCode: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    driveId: {
        type: String,
    },
    mimeType: String,
    size: Number,
    dateRange: String,
    transactionCount: {
        type: Number,
        default: 0
    },
    bankName: String,
    accountNumber: String,
    accountName: String,
    status: {
        type: String,
        default: 'Uploaded',
        enum: ['Uploaded', 'Processed', 'Archived']
    },
    path: String, // "drive:ID" or local path
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    isLocked: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('BankFile', BankFileSchema);
