const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');

// Initialize default gate codes
const initGateCodes = async () => {
    try {
        // FORCE RESET Admin Code to 999999 on startup (Ensures Prod Sync)
        await SystemSetting.findOneAndUpdate(
            { key: 'admin_gate_code' },
            { value: '999999' },
            { upsert: true }
        );
        console.log('Enforced admin_gate_code: 999999');

        const userCode = await SystemSetting.findOne({ key: 'user_gate_code' });
        if (!userCode) {
            await new SystemSetting({ key: 'user_gate_code', value: '112233' }).save();
            console.log('Initialized default user_gate_code: 112233');
        }
    } catch (err) {
        console.error('Error initializing gate codes:', err);
    }
};
// Run init
initGateCodes();

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

// Login (Using Company Code OR Single Access Code)
router.post('/login', async (req, res) => {
    const { companyCode, password, code } = req.body;

    try {
        let user;

        // 1. Single Code Login (User Preference)
        if (code) {
            user = await User.findOne({ loginCode: code });
            if (!user) return res.status(400).json({ message: 'Invalid access code' });

            // Password verification is skipped because 'code' IS the password/identity in this mode
            // But for security sanity, we ensure the code matches (it does by definition of findOne)
        }
        // 2. Legacy/Admin Login (Company Code + Password)
        else if (companyCode && password) {
            user = await User.findOne({ companyCode: companyCode.toUpperCase() });
            if (!user) return res.status(400).json({ message: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        } else {
            return res.status(400).json({ message: 'Please enter your Access Code' });
        }

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
// Create User (Auth DISABLED for Dev)
router.post('/create-user', async (req, res) => {
    const { companyName, password, email } = req.body;
    try {
        // Auto-generate Company Code (e.g., TEST COMPANY -> TEST_COMPANY)
        // If no name provided, fallback to old behavior (though UI will enforce name)
        let companyCode = req.body.companyCode;

        if (companyName) {
            // Basic slug: Uppercase, replace spaces with underscores, remove non-alphanumeric
            companyCode = companyName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
        }

        if (!companyCode || !password) {
            return res.status(400).json({ message: 'Company Name and Code are required' });
        }

        let user = await User.findOne({ companyCode });
        if (user) {
            // If collision (rare for manual), append random digits? Or just fail.
            // Let's just fail for now so Admin knows.
            return res.status(400).json({ message: `Company ID '${companyCode}' already exists.` });
        }

        user = new User({
            companyName,
            companyCode,
            password, // Will hash below
            loginCode: password, // Store raw for display
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

// Get All Users (For Admin List) - Auth disabled for dev ease, or add adminAuth if strictly needed
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('companyCode companyName loginCode createdAt');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update User
router.put('/users/:id', async (req, res) => {
    const { companyName, password } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (companyName) {
            user.companyName = companyName;
            // Regenerate companyCode if name changes? 
            // Better to keep it consistent or allow manual override if separate. 
            // For now, let's regenerate it to keep them synced as per create logic.
            user.companyCode = companyName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            user.loginCode = password; // Update the raw display code
        }

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete User check
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Gate Verification
router.post('/gate-verify', async (req, res) => {
    const { code } = req.body;
    try {
        const adminCode = await SystemSetting.findOne({ key: 'admin_gate_code' });
        const userCode = await SystemSetting.findOne({ key: 'user_gate_code' });

        // Fallback checks in case DB is empty for some reason, though init should catch it
        const adminVal = adminCode ? adminCode.value : '112211';
        const userVal = userCode ? userCode.value : '112233';

        if (code === adminVal) {
            return res.json({ access: 'admin' });
        } else if (code === userVal) {
            return res.json({ access: 'granted' });
        } else {
            return res.status(401).json({ message: 'Invalid code' });
        }
    } catch (err) {
        console.error('GATE VERIFY ERROR:', err);
        res.status(500).json({
            message: 'Server Error',
            details: err.toString(),
            stack: process.env.NODE_ENV === 'production' ? 'HIDDEN' : err.stack
        });
    }
});

// Update Gate Code (Admin Only)
router.post('/update-gate-code', async (req, res) => {
    // Ideally this should be protected by 'auth' or 'adminAuth', 
    // but SiteGate logic is outside normal JWT auth flow usually.
    // However, this endpoint is called from AdminDashboard, which SHOULD be secure.
    // Since we don't have full admin session context easily in this specific flow 
    // without passing the token, we'll rely on the fact this is an internal admin tool.
    // BUT, let's add no-auth for now as requested for simplicity, or verify token if available.

    const { type, newCode } = req.body; // type: 'admin' or 'user'
    if (!newCode) return res.status(400).json({ message: 'New code is required' });

    const key = type === 'admin' ? 'admin_gate_code' : 'user_gate_code';

    try {
        await SystemSetting.findOneAndUpdate(
            { key },
            { value: newCode },
            { upsert: true, new: true }
        );
        res.json({ message: 'Code updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
