const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AccessUser = require('../models/AccessUser');
const SystemSetting = require('../models/SystemSetting');
const auth = require('../middleware/auth');

// --- 1. Login Logic (Username + Access Code) ---
router.post('/login', async (req, res) => {
    const { username, code } = req.body;

    try {
        console.log(`[Auth] Login attempt for user: ${username || 'NONE'}`);
        if (!username || !code) return res.status(400).json({ message: 'Username and Access Code required' });

        let user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        // EMERGENCY FALLBACK: Support master users if DB entry is missing or sync is slow
        if (!user) {
            const upName = username?.toUpperCase();
            if (upName === 'ADMIN' && code === '999999') {
                user = await User.findOne({ role: 'admin' });
            } else if (upName === 'GKSMART' && code === '666666') {
                user = await User.findOne({ username: 'GKSMART' });
            }
        }

        if (!user) return res.status(400).json({ message: 'Access Denied: Invalid Username' });

        // Verify Access Code
        if (user.loginCode !== code) {
            // Check for hardcoded fallback during transition (Safety)
            const upName = username?.toUpperCase();
            const isFallbackAdmin = (upName === 'ADMIN' && code === '999999');
            const isFallbackUser = (upName === 'GKSMART' && code === '666666');
            if (!isFallbackAdmin && !isFallbackUser) {
                return res.status(400).json({ message: 'Access Denied: Invalid Code' });
            }
        }

        const payload = {
            id: user._id,
            role: user.role,
            username: user.username,
            companyCode: user.companyCode
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                companyCode: user.companyCode
            }
        });
    } catch (err) {
        console.error('[Auth Error]', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- 2. Admin: User (Company) Management ---

// Create User (Company)
router.post('/create-user', auth, async (req, res) => {
    // Check if requester is admin
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { username, companyName, password } = req.body; // 'password' field in form is the loginCode
    try {
        if (!username || !password) return res.status(400).json({ message: 'Username and Access Code are required' });

        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ggmt1235#', salt); // Standard internal password

        const newUser = new User({
            username,
            companyName: companyName || username,
            companyCode: username.toUpperCase().replace(/\s+/g, '_'),
            password: hashedPassword,
            loginCode: password,
            role: 'user'
        });

        await newUser.save();
        res.json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get All Users
router.get('/users', auth, async (req, res) => {
    // Check if requester is admin
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const users = await User.find({ role: 'user' }).select('username companyName loginCode createdAt');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update User
router.put('/users/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { companyName, password } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (companyName) user.companyName = companyName;
        if (password) user.loginCode = password;

        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete User
router.delete('/users/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// --- 3. Security Settings ---



router.post('/gate-verify', async (req, res) => {
    const { code } = req.body;
    try {
        // --- 1. SESSION BRIDGE: Check if this code belongs to a standard user (Instant Entry) ---
        // Priority to 'Admin' (999999) or 'GKSMART' (666666) override users
        let userOverdrive = null;
        if (code === '999999') userOverdrive = await User.findOne({ username: 'Admin' });
        else if (code === '666666') userOverdrive = await User.findOne({ username: 'GKSMART' });
        else {
            // Check if any other user has this code as their primary login code
            userOverdrive = await User.findOne({ loginCode: code });
        }

        if (userOverdrive) {
            console.log(`[Gate-Session Bridge] Instant login authorized for: ${userOverdrive.username}`);
            const payload = {
                id: userOverdrive._id,
                role: userOverdrive.role,
                username: userOverdrive.username,
                companyCode: userOverdrive.companyCode
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                access: userOverdrive.role === 'admin' ? 'admin' : 'granted',
                token,
                user: {
                    id: userOverdrive._id,
                    username: userOverdrive.username,
                    role: userOverdrive.role,
                    companyCode: userOverdrive.companyCode
                }
            });
        }

        // --- 2. FALLBACK: Generic gate access if no user match ---
        const adminCode = await SystemSetting.findOne({ key: 'admin_gate_code' });
        const userCode = await SystemSetting.findOne({ key: 'user_gate_code' });

        const adminVal = adminCode?.value || '999999';
        const userVal = userCode?.value || '666666';

        if (code === adminVal) return res.json({ access: 'admin' });
        if (code === userVal) return res.json({ access: 'granted' });

        res.status(401).json({ message: 'Invalid code' });
    } catch (err) {
        console.error('[Gate Error]', err);
        res.status(500).json({ message: 'Gate Error' });
    }
});

// Access Control Logic (Page Level Locking)
router.post('/access-verify', async (req, res) => {
    const { code } = req.body;
    try {
        const setting = await SystemSetting.findOne({ key: 'access_control_code' });
        if (code === (setting?.value || '888888')) return res.json({ success: true });
        res.status(401).json({ message: 'Invalid' });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

router.post('/update-access-control-code', async (req, res) => {
    const { newCode } = req.body;
    if (!newCode || newCode.length !== 6) return res.status(400).json({ message: '6-digit required' });
    try {
        await SystemSetting.findOneAndUpdate({ key: 'access_control_code' }, { value: newCode }, { upsert: true });
        res.json({ message: 'Control updated' });
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

// Department Authority (Sub-users)
router.get('/access-users', async (req, res) => {
    const users = await AccessUser.find().sort({ createdAt: -1 });
    res.json(users);
});

router.post('/access-users', async (req, res) => {
    const { name, level, code } = req.body;
    const newUser = new AccessUser({ name, level, code });
    await newUser.save();
    res.json(newUser);
});

router.delete('/access-users/:id', async (req, res) => {
    await AccessUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

module.exports = router;
