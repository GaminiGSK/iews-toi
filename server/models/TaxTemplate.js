const mongoose = require('mongoose');

const TaxTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    groupName: { type: String, default: 'TOI-01' }, // Group these 25 pages
    pageNumber: { type: Number }, // Sequence 1-25
    originalName: { type: String },
    filename: { type: String, required: true }, // Saved filename on disk
    path: { type: String, required: true },
    type: { type: String },
    size: { type: Number },
    data: { type: String }, // Base64 Content (For Cloud Run Persistence)
    mappings: [{
        id: { type: String }, // Internal ID for the box
        label: { type: String }, // e.g., "A1"
        x: { type: Number },
        y: { type: Number },
        w: { type: Number },
        h: { type: Number },
        semanticLabel: { type: String }, // AI generated label e.g. "Revenue"
        linkedCode: { type: String } // Linked GL/TOI code
    }],
    status: { type: String, default: 'New' }, // New, Configured, Active
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TaxTemplate', TaxTemplateSchema);
