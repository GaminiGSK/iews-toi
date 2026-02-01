const mongoose = require('mongoose');

const CompanyProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to User Model
    companyCode: { type: String, required: true, unique: true },
    companyNameEn: { type: String },
    companyNameKh: { type: String },
    registrationNumber: { type: String },
    oldRegistrationNumber: { type: String },
    incorporationDate: { type: String },
    companyType: { type: String },
    address: { type: String },
    shareholder: { type: String },
    director: { type: String },
    vatTin: { type: String },
    businessActivity: { type: String },

    // Structured Documents List
    documents: [{
        docType: { type: String, required: true }, // 'moc_cert', 'kh_extract', 'en_extract', 'tax_patent', 'tax_id', 'bank_opening'
        originalName: String,
        path: String,
        data: String, // Base64 Storage (TOI-Style)
        mimeType: String,
        status: { type: String, default: 'Pending' }, // 'Pending', 'Verified', 'Error'
        extractedText: String, // Raw AI text if needed
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Bank Details (Extracted)
    bankName: { type: String },
    bankAccountName: { type: String },
    bankAccountNumber: { type: String },
    bankCurrency: { type: String },

    extractedData: { type: Map, of: String } // For flexibility
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', CompanyProfileSchema);
