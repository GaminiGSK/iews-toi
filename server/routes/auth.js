const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check auth
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

// Admin only middleware
const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Admins only.' });
        }
    });
};

// Login (Using Company Code)
router.post('/login', async (req, res) => {
    const { companyCode, password } = req.body;

    // DEV MODE BYPASS: Allow GGMT to login even if DB is down
    if (companyCode && companyCode.toUpperCase() === 'GGMT') {
        const payload = { id: 'mock_id', role: 'user', isFirstLogin: false, companyCode: 'GGMT' };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        return res.json({
            token,
            user: { id: 'mock_id', companyCode: 'GGMT', role: 'user', isFirstLogin: false }
        });
    }

    try {
        // Find by Company Code (Case Insensitive)
        const user = await User.findOne({ companyCode: companyCode.toUpperCase() });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: user._id, role: user.role, isFirstLogin: user.isFirstLogin, companyCode: user.companyCode };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user._id, companyCode: user.companyCode, role: user.role, isFirstLogin: user.isFirstLogin } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Change Password
router.post('/change-password', auth, async (req, res) => {
    const { newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.isFirstLogin = false;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create User (Auth DISABLED for Dev)
router.post('/create-user', async (req, res) => {
    const { companyCode, password, email } = req.body;
    try {
        let user = await User.findOne({ companyCode });
        if (user) return res.status(400).json({ message: 'Company Code already exists' });

        user = new User({
            companyCode,
            password,
            email,
            role: 'user'
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.json({ message: 'User created successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
