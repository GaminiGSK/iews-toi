const mongoose = require('mongoose');

const MonthRowSchema = new mongoose.Schema({
    month:        { type: String },   // 'Jan', 'Feb', ... 'Dec'
    grossSalary:  { type: Number, default: 0 },
    tosFiled:     { type: Number, default: 0 },
    tosPaid:      { type: Number, default: 0 },
}, { _id: false });

const EmployeeGroupSchema = new mongoose.Schema({
    position:     { type: String },
    count:        { type: Number, default: 0 },
    annualSalary: { type: Number, default: 0 },
    fringeBenefits: { type: Number, default: 0 },
}, { _id: false });

const SalaryModuleSchema = new mongoose.Schema({
    companyCode:        { type: String, required: true, unique: true },
    // Section A — Setup questions
    hasEmployees:       { type: String, default: 'yes' },
    tosFiledMonthly:    { type: String, default: 'yes' },
    hasNonResident:     { type: String, default: 'no' },
    hasFringe:          { type: String, default: 'no' },
    directorSalary:     { type: String, default: 'no' },
    // Section B — Employee groups
    shareholderEmployees:    [EmployeeGroupSchema],
    nonShareholderEmployees: [EmployeeGroupSchema],
    // Section C — Monthly TOS table (12 rows)
    monthlyTOS: [MonthRowSchema],
    // Document uploads
    uploads: [{
        label:      { type: String },
        month:      { type: String },   // 'Jan'-'Dec' or 'Annual'
        fileName:   { type: String },
        mimeType:   { type: String },
        data:       { type: String },   // base64
        uploadedAt: { type: Date, default: Date.now }
    }],
    lastSaved:  { type: Date },
    savedBy:    { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SalaryModule', SalaryModuleSchema);
