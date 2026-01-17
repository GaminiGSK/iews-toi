const mongoose = require('mongoose');

const CompanyProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to User Model
    companyCode: { type: String, required: true, unique: true },
    companyNameEn: { type: String },
    companyNameKh: { type: String },
    registrationNumber: { type: String },
    incorporationDate: { type: String },
    companyType: { type: String },
    address: { type: String },
    shareholder: { type: String },
    director: { type: String },
    vatTin: { type: String },
    businessActivity: { type: String },
    businessRegistration: { type: String }, // Path to PDF
    extractedData: { type: Map, of: String } // For flexibility
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', CompanyProfileSchema);
