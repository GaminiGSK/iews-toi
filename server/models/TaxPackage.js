const mongoose = require('mongoose');

const TaxPackageSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Review', 'Filed', 'In Progress'],
        default: 'Draft'
    },
    progress: {
        type: Number,
        default: 0
    },
    documents: [{
        name: String,
        status: String,
        updatedAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TaxPackage', TaxPackageSchema);
