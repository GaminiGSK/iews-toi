const mongoose = require('mongoose');

const CompanyProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true, unique: true },

    // Core Identity
    companyNameEn: { type: String },
    companyNameKh: { type: String },
    registrationNumber: { type: String },
    oldRegistrationNumber: { type: String },
    incorporationDate: { type: String },
    companyType: { type: String },
    companySubType: { type: String },

    // Addresses
    address: { type: String },        // Physical address
    postalAddress: { type: String },  // Postal address

    // Contact
    contactEmail: { type: String },
    contactPhone: { type: String },

    // Tax
    vatTin: { type: String },
    taxRegistrationDate: { type: String },

    // Business
    businessActivity: { type: String },

    // Capital & Ownership
    registeredShareCapitalKHR: { type: String },
    moreThanOneClassOfShares: { type: Boolean, default: false },
    majorityNationality: { type: String },
    percentageOfMajorityShareholders: { type: String },

    // Governance (flat strings — legacy / display)
    director: { type: String },
    shareholder: { type: String },

    // Governance (full structured arrays — from BR extraction)
    directors: [{
        nameKh: String,
        nameEn: String,
        address: String,
        isChairman: { type: Boolean, default: false }
    }],
    shareholders: [{
        nameKh: String,
        nameEn: String,
        address: String,
        numberOfShares: { type: Number, default: 0 },
        nationality: String,
        isChairman: { type: Boolean, default: false }
    }],

    // Structured Documents List
    documents: [{
        docType: { type: String, required: true },
        originalName: String,
        path: String,
        data: String,    // Base64 Storage
        mimeType: String,
        status: { type: String, default: 'Pending' },
        extractedData: { type: mongoose.Schema.Types.Mixed },
        rawText: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Bank Details
    bankName: { type: String },
    bankAccountName: { type: String },
    bankAccountNumber: { type: String },
    bankCurrency: { type: String },

    // AI Profile
    organizedProfile: { type: String },
    extractedData: { type: Map, of: String },

    // Accounting
    abaOpeningBalance: { type: Number, default: 0 },
    lockedGLYears: [{ type: String }], // e.g. ["2024", "2025"]

    // GDT e-Tax Portal Credentials
    gdtUsername: { type: String, default: '' },
    gdtPassword: { type: String, default: '' },

    // Business AI Rules
    businessRules: [{
        content: String,
        addedBy: String,
        createdAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }]

}, { timestamps: true, strict: false }); // strict:false allows flexible field additions

module.exports = mongoose.model('CompanyProfile', CompanyProfileSchema);
