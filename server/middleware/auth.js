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
        const user = await User.findById(decoded.id).select('companyCode role username driveFolderId bankStatementsFolderId brFolderId createdBy');

        if (!user) return res.status(401).json({ message: 'User no longer exists' });

        req.user = {
            id: user._id,
            role: user.role,
            username: user.username,
            companyCode: user.companyCode,
            driveFolderId: user.driveFolderId,
            bankStatementsFolderId: user.bankStatementsFolderId,
            brFolderId: user.brFolderId,
            createdBy: user.createdBy,
        };

        // --- ADMIN / SUPERADMIN SPOOFING FOR DASHBOARD ---
        // Superadmin and Admin can impersonate a unit for support
        const canSpoof = user.role === 'admin' || user.role === 'superadmin';
        if (canSpoof) {
            const targetUserHeader = req.header('x-target-user') || req.query.targetUser;
            if (targetUserHeader) {
                const target = await User.findOne({ username: targetUserHeader }).select('_id username companyCode driveFolderId bankStatementsFolderId brFolderId createdBy');
                if (target) {
                    // SECURE TENANCY ENFORCEMENT:
                    const isSuperadmin = user.role === 'superadmin';
                    const isSelf = target._id.equals(user._id);
                    const isOwnedUnit = target.createdBy && target.createdBy.equals(user._id);
                    
                    if (isSuperadmin || isSelf || isOwnedUnit) {
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
        }

        next();
    } catch (e) {
        console.error('[Auth Middleware Error]', e.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// ── Role Helpers ──────────────────────────────────────────────────────────────
// Use these in routes instead of hardcoding role strings

/** True only for superadmin */
const isSuperadmin = (req) => req.user?.role === 'superadmin';

/** True for admin OR superadmin (superadmin can do everything admin can) */
const isAdmin = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin';

/** True for unit/user (the company-level users) */
const isUnit = (req) => req.user?.role === 'unit' || req.user?.role === 'user';

module.exports = auth;
module.exports.isSuperadmin = isSuperadmin;
module.exports.isAdmin = isAdmin;
module.exports.isUnit = isUnit;
