const mongoose = require('mongoose');

const ProfileTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, default: 'Default Template' },
    sections: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        fields: [{
            key: { type: String, required: true },
            label: { type: String, required: true },
            type: { type: String, default: 'text' }, // 'text', 'date', 'textarea', 'checkbox'
            required: { type: Boolean, default: false }
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('ProfileTemplate', ProfileTemplateSchema);
