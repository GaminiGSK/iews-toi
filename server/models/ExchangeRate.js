const mongoose = require('mongoose');

const ExchangeRateSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true },
    year: { type: Number, required: true },
    rate: { type: Number, required: true }, // KHR per 1 USD
}, { timestamps: true });

// Ensure one rate per year per company
ExchangeRateSchema.index({ companyCode: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);
