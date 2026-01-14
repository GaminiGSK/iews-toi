const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    companyCode: { type: String, required: true, unique: true }, // Acts as Username/Login ID
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    isFirstLogin: { type: Boolean, default: true },
    email: { type: String } // Optional now
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
