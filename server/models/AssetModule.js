const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    companyCode: { type: String, required: true, index: true },
    description:      { type: String, required: true },
    category:         { type: String, required: true }, // 'Furniture','Computer','Vehicle','Building','Other'
    pool:             { type: String },                 // 'Pool 1','Pool 2', etc.
    rate:             { type: Number, default: 0 },     // depreciation rate %
    purchaseDate:     { type: String },                 // dd/mm/yyyy
    cost:             { type: Number, default: 0 },     // Original cost USD
    accDepOpening:    { type: Number, default: 0 },     // Acc dep brought forward
    additions:        { type: Number, default: 0 },     // Additions this year
    disposals:        { type: Number, default: 0 },     // Disposals this year
    // Calculated fields (also stored for report use)
    depThisYear:      { type: Number, default: 0 },
    nbv:              { type: Number, default: 0 },
    invoiceRef:       { type: String },                 // Optional invoice reference
    notes:            { type: String },
}, { timestamps: true });

// Settings / header record for the whole module
const AssetModuleSchema = new mongoose.Schema({
    companyCode:      { type: String, required: true, unique: true },
    hasAssets:        { type: String, default: 'yes' }, // 'yes' | 'no'
    depMethod:        { type: String, default: 'GDT Pooling' },
    isFirstYear:      { type: String, default: 'no' },
    assets:           [AssetSchema],
    // Document uploads stored as base64 or drive path refs
    uploads: [{
        label:        { type: String },
        fileName:     { type: String },
        mimeType:     { type: String },
        data:         { type: String },   // base64
        uploadedAt:   { type: Date, default: Date.now }
    }],
    lastSaved:        { type: Date },
    savedBy:          { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AssetModule', AssetModuleSchema);
