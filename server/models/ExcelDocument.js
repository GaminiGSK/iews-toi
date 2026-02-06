const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExcelDocumentSchema = new Schema({
    name: { type: String, required: true },
    size: { type: String },
    headers: { type: [String], default: [] },
    rows: { type: [[Schema.Types.Mixed]], default: [] }, // Array of Arrays
    merges: { type: [Schema.Types.Mixed], default: [] }, // Store merge ranges
    cellMappings: { type: Schema.Types.Mixed, default: {} }, // { "R_C": "variable_key" }
    colWidths: { type: [Schema.Types.Mixed], default: [] }, // Store column widths
    rowHeights: { type: [Schema.Types.Mixed], default: [] }, // Store row heights
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExcelDocument', ExcelDocumentSchema);
