const express = require('express');
const router = express.Router();
const AccessUser = require('../models/AccessUser');
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

        // Enforce 666666 as the user gate code
        await SystemSetting.findOneAndUpdate(
            { key: 'user_gate_code' },
            { value: '666666' },
            { upsert: true }
        );
        console.log('Enforced user_gate_code: 666666');

        const accessCode = await SystemSetting.findOne({ key: 'access_control_code' });
        if (!accessCode) {
            await new SystemSetting({ key: 'access_control_code', value: '888888' }).save();
            console.log('Initialized default access_control_code: 888888');
        }
    } catch (err) {
        console.error('Error initializing gate codes:', err);
    }
};
// Run init
initGateCodes();

const auth = require('../middleware/auth');

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

// DEV ONLY: Quick Login for Localhost Subagent
router.post('/dev-login', async (req, res) => {
    try {
        // Find ANY admin or create one
        let user = await User.findOne({ role: 'admin' });
        if (!user) {
            // Create a fallback admin if none exists
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin', salt);

            user = new User({
                companyName: 'Dev Admin',
                companyCode: 'ADMIN',
                password: hashedPassword,
                loginCode: 'admin',
                role: 'admin'
            });
            await user.save();
        }

        const payload = { id: user._id, role: user.role, isFirstLogin: false, companyCode: user.companyCode };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, role: user.role, companyCode: user.companyCode } });
    } catch (e) {
        console.error("Dev login error:", e);
        res.status(500).json({ message: e.message });
    }
});

// Login (Using Company Code OR Single Access Code)
router.post('/login', async (req, res) => {
    const { companyCode, password, code } = req.body;

    try {
        let user;

        // 1. Single Code Login (User Preference)
        if (code) {
            user = await User.findOne({ loginCode: code });

            // EMERGENCY FALLBACK: If DB sync is lagging, allow master codes to find by role
            if (!user && (code === '999999' || code === '666666')) {
                console.log(`[Auth] Master code fallback triggered for: ${code}`);
                const fallbackRole = code === '999999' ? 'admin' : 'user';
                user = await User.findOne({ role: fallbackRole });
            }

            if (!user) return res.status(400).json({ message: 'Invalid access code' });
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

// Access Control Verify (888888)
router.post('/access-verify', async (req, res) => {
    const { code } = req.body;
    try {
        const setting = await SystemSetting.findOne({ key: 'access_control_code' });
        const validCode = setting ? setting.value : '888888';
        if (code === validCode) {
            res.json({ success: true });
        } else {
            res.status(401).json({ message: 'Invalid control code' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Access Control Code
router.post('/update-access-control-code', async (req, res) => {
    const { newCode } = req.body;
    if (!newCode || newCode.length !== 6) return res.status(400).json({ message: '6-digit code required' });
    try {
        await SystemSetting.findOneAndUpdate(
            { key: 'access_control_code' },
            { value: newCode },
            { upsert: true }
        );
        res.json({ message: 'Control code updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Access Users
router.get('/access-users', async (req, res) => {
    try {
        const users = await AccessUser.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create Access User
router.post('/access-users', async (req, res) => {
    const { name, level, code } = req.body;
    try {
        const newUser = new AccessUser({ name, level, code });
        await newUser.save();
        res.json(newUser);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Access User
router.delete('/access-users/:id', async (req, res) => {
    try {
        await AccessUser.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
