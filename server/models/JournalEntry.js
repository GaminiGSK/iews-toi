const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyCode: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, required: true }, // e.g., "Year-End Depreciation"
    reference: { type: String }, // e.g., "ADJ-2024-001"
    status: { type: String, enum: ['Draft', 'Posted'], default: 'Posted' },

    // The "Rows" the bot adds
    lines: [{
        accountCode: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountCode', required: true },
        description: { type: String }, // Optional line-item detail
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 }
    }],

    // Metadata for the Blue Bot
    createdBy: { type: String, default: 'Manual' }, // 'Manual' or 'BlueBot'
    aiReasoning: { type: String } // Why the bot made this entry
}, { timestamps: true });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
