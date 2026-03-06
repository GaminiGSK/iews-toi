const jwt = require('jsonwebtoken');

// Middleware to check auth
const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // --- 2026-02-17: SYNC PROTECTION ---
        // Stale tokens from yesterday might contain old companyCodes.
        // We look up the user to ensure we have the LATEST companyCode for filtering.
        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('companyCode role username driveFolderId bankStatementsFolderId brFolderId');

        if (!user) return res.status(401).json({ message: 'User no longer exists' });

        req.user = {
            id: user._id,
            role: user.role,
            username: user.username,
            companyCode: user.companyCode,
            driveFolderId: user.driveFolderId,
            bankStatementsFolderId: user.bankStatementsFolderId,
            brFolderId: user.brFolderId
        };

        // --- ADMIN SPOOFING FOR DASHBOARD ---
        if (req.user.role === 'admin') {
            const targetUserHeader = req.header('x-target-user') || req.query.targetUser;
            if (targetUserHeader) {
                const target = await User.findOne({ username: targetUserHeader }).select('_id username companyCode driveFolderId bankStatementsFolderId brFolderId');
                if (target) {
                    req.user.id = target._id;
                    req.user._id = target._id;
                    req.user.username = target.username;
                    req.user.companyCode = target.companyCode;
                    req.user.driveFolderId = target.driveFolderId;
                    req.user.bankStatementsFolderId = target.bankStatementsFolderId;
                    req.user.brFolderId = target.brFolderId;
                    req.user._isSpoofed = true;
                }
            }
        }

        next();
    } catch (e) {
        console.error('[Auth Middleware Error]', e.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
