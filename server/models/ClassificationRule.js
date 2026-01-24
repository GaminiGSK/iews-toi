const mongoose = require('mongoose');

const ClassificationRuleSchema = new mongoose.Schema({
    companyCode: { type: String, required: true },
    name: { type: String, required: true }, // e.g., "Rent Rule"
    priority: { type: Number, default: 0 }, // Higher # runs first

    // Condition
    ruleType: {
        type: String,
        required: true,
        enum: ['keyword', 'amount_in', 'amount_out']
    },
    // For keywords: "rent", "feed"
    // For amounts: "10" (comparison handled by logic)
    criteria: { type: mongoose.Schema.Types.Mixed, required: true },

    // Comparison Operator
    operator: {
        type: String,
        enum: ['contains', 'equals', 'lt', 'gt', 'lte', 'gte', 'always'],
        default: 'contains'
    },

    // Action
    targetAccountCode: { type: String, required: true }, // e.g., '61000'
    targetAccountName: { type: String }, // For verification

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ClassificationRule', ClassificationRuleSchema);
