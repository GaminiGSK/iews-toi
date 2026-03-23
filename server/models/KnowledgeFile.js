const mongoose = require('mongoose');

/**
 * KnowledgeFile — Superadmin Super Knowledge Vault
 * PDFs dropped by Superadmin into Google Drive for BA TOI & BA Audit to learn from.
 */
const KnowledgeFileSchema = new mongoose.Schema({
    filename:     { type: String, required: true },        // Original PDF file name
    driveFileId:  { type: String, required: true },        // Google Drive file ID
    driveFolder:  { type: String },                        // Sub-folder name (tax_laws, etc.)
    category: {
        type: String,
        enum: ['tax_laws', 'gdt_circulars', 'toi_guidelines', 'audit_standards', 'other'],
        default: 'other'
    },
    rawText:      { type: String },                        // Extracted text from PDF
    summary:      { type: String },                        // AI-generated summary
    isActive:     { type: Boolean, default: true },        // Toggle on/off
    readAt:       { type: Date },                          // When BA last read this
    uploadedBy:   { type: String, default: 'superadmin' },
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeFile', KnowledgeFileSchema);
