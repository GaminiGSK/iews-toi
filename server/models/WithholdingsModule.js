const mongoose = require('mongoose');

const RentalItemSchema = new mongoose.Schema({
    description:   { type: String },        // e.g. "Main Office - 2nd Floor"
    landlordName:  { type: String },        // Landlord / owner name
    assetType:     { type: String },        // 'Immovable' | 'Movable'
    leasePeriod:   { type: String },        // e.g. "Jan 2025 - Dec 2025"
    annualAmount:  { type: Number, default: 0 }, // Gross annual rent (USD)
    whtRate:       { type: Number, default: 10 }, // Always 10% for rentals
    invoiceRef:    { type: String },
    notes:         { type: String },
}, { _id: false });

const ServiceItemSchema = new mongoose.Schema({
    description:   { type: String },        // e.g. "Monthly car maintenance"
    providerName:  { type: String },
    serviceType:   { type: String },        // e.g. 'Car Maintenance', 'Building Repairs', 'IT Services'
    leasePeriod:   { type: String },
    annualAmount:  { type: Number, default: 0 }, // Net service fee (USD, before VAT)
    vatRate:       { type: Number, default: 15 }, // Cambodia VAT = 15%
    invoiceRef:    { type: String },
    notes:         { type: String },
}, { _id: false });

const WithholdingsModuleSchema = new mongoose.Schema({
    companyCode:      { type: String, required: true, unique: true },
    hasRentals:       { type: String, default: 'no' },   // 'yes' | 'no'
    hasServices:      { type: String, default: 'no' },   // 'yes' | 'no'
    immovableRentals: [RentalItemSchema],
    movableRentals:   [RentalItemSchema],
    serviceContracts: [ServiceItemSchema],
    lastSaved:        { type: Date },
    savedBy:          { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WithholdingsModule', WithholdingsModuleSchema);
