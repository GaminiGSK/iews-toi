const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'admin_gate_code'
    value: { type: String, required: true }
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
