const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    companyCode: { type: String, required: true, unique: true }, // Internal ID
    password: { type: String, required: true },
    companyName: { type: String }, // Display Name
    loginCode: { type: String }, // 6-digit access code
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    isFirstLogin: { type: Boolean, default: true },
    email: { type: String },
    driveFolderId: { type: String },
    bankStatementsFolderId: { type: String },
    brFolderId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
