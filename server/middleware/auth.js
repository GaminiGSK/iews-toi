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
        const user = await User.findById(decoded.id).select('companyCode role username');

        if (!user) return res.status(401).json({ message: 'User no longer exists' });

        req.user = {
            id: user._id,
            role: user.role,
            username: user.username,
            companyCode: user.companyCode // THIS IS THE CRITICAL LINE
        };

        next();
    } catch (e) {
        console.error('[Auth Middleware Error]', e.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
