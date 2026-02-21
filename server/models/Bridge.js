const mongoose = require('mongoose');

const BridgeSchema = new mongoose.Schema({
    source: { type: String, default: 'External Gemini' }, // Where the data is coming from
    type: { type: String, enum: ['instruction', 'update', 'build_log', 'feature_request', 'status'], default: 'instruction' },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['unread', 'acknowledged', 'completed'], default: 'unread' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Bridge', BridgeSchema);
