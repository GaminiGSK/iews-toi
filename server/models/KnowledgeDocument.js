const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema({
    title: { type: String, default: 'Untitled Document' },
    category: { 
        type: String, 
        enum: ['TAX_LAW', 'GDT_CIRCULAR', 'TOI_GUIDELINE', 'AUDIT_STANDARD'],
        default: 'GDT_CIRCULAR'
    },
    originalFileName: { type: String, required: true },
    dateIssued: { type: Date },
    originalTextKhmer: { type: String }, // Raw OCR extraction from Gemini
    translatedEnglish: { type: String }, // Translated/Processed rules
    structuredRules: { type: mongoose.Schema.Types.Mixed }, // JSON for future AI context binding
    driveFileId: { type: String }, // For future Drive archiving
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
