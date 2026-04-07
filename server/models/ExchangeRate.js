const mongoose = require('mongoose');

const ExchangeRateSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true },
    year: { type: Number, required: true },
    // Legacy single rate (kept for backward compatibility with TB report)
    rate: { type: Number, default: null },
    // 4 exchange rate types
    BE: { type: Number, default: null }, // Bank Exchange
    ME: { type: Number, default: null }, // Market Exchange
    GE: { type: Number, default: null }, // GDT Exchange
    IE: { type: Number, default: null }, // Internal Exchange
}, { timestamps: true });

// One record per year per company
ExchangeRateSchema.index({ companyCode: 1, year: 1 }, { unique: true });

// Virtual: resolve the primary rate used for TB (GE first, then BE, then ME, then IE, then legacy rate)
ExchangeRateSchema.virtual('effectiveRate').get(function () {
    return this.GE || this.BE || this.ME || this.IE || this.rate || 0;
});

module.exports = mongoose.model('ExchangeRate', ExchangeRateSchema);
