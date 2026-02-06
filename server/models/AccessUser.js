const mongoose = require('mongoose');

const AccessUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Management', 'Approval', 'Data'],
        required: true
    },
    code: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AccessUser', AccessUserSchema);
