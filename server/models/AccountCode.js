const mongoose = require('mongoose');

const AccountCodeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true },
    code: { type: String, required: true, trim: true },
    toiCode: { type: String, required: true, trim: true }, // Standard System Code
    description: { type: String, required: true, maxlength: 50, trim: true },
    matchDescription: { type: String, trim: true },

    // Audit Features
    note: { type: String, trim: true, default: '' }, // Audit Note Ref (e.g., "A12")

    // Prior Year Comparatives (Manual Input)
    priorYearDr: { type: Number, default: 0 },
    priorYearCr: { type: Number, default: 0 }

}, { timestamps: true });

// Ensure codes are unique per company
AccountCodeSchema.index({ companyCode: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('AccountCode', AccountCodeSchema);
