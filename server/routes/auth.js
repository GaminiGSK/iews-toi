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
            companyCode: user.companyCode,
            driveFolderId: user.driveFolderId
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                companyCode: user.companyCode,
                driveFolderId: user.driveFolderId
            }
        });
    } catch (err) {
        console.error('[Auth Error]', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// --- 1b. Get current logged-in user info ---
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username companyName role isFirstLogin');
        if (!user) return res.status(404).json({ message: 'Not found' });
        res.json(user);
    } catch (e) { res.status(500).json({ message: 'Server Error' }); }
});

// --- 2. Admin: User (Company) Management ---

// Create User/Unit (Admin only)
router.post('/create-user', auth, async (req, res) => {
    // Admin (or superadmin managing directly) can create units
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { username, companyName, password } = req.body; // 'password' field in form is the loginCode
    try {
        if (!username || !password) return res.status(400).json({ message: 'Username and Access Code are required' });

        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ggmt1235#', salt); // Standard internal password

        const { createFolder, findFolder } = require('../services/googleDrive');
        // Parent is 'BR template' sub-folder
        const driveRoot = "1Z56h5vAURMvM0Dad9zmcLjO8zeM5AoJf" || process.env.GOOGLE_DRIVE_FOLDER_ID;
        let driveFolderId = null;
        let bankStatementsFolderId = null;
        let brFolderId = null;

        try {
            console.log(`[Admin] Initializing Drive Workspace for user: ${username}`);
            // 1. User Root Folder
            let existingFolder = await findFolder(username, driveRoot);
            if (!existingFolder) {
                const folder = await createFolder(username, driveRoot);
                driveFolderId = folder.id;
            } else {
                driveFolderId = existingFolder.id;
            }

            // 2. Sub-folder: bank statements
            if (driveFolderId) {
                console.log(`[Admin] Creating sub-folders for ${username}...`);
                let bankSub = await findFolder('bank statements', driveFolderId);
                if (!bankSub) bankSub = await createFolder('bank statements', driveFolderId);
                bankStatementsFolderId = bankSub.id;

                // 3. Sub-folder: BR
                let brSub = await findFolder('BR', driveFolderId);
                if (!brSub) brSub = await createFolder('BR', driveFolderId);
                brFolderId = brSub.id;
            }
        } catch (driveErr) {
            console.warn(`[Admin] Drive Folder Init Warning: ${driveErr.message}`);
        }

        const newUser = new User({
            username,
            companyName: companyName || username,
            companyCode: username.toUpperCase().replace(/\s+/g, '_'),
            password: hashedPassword,
            loginCode: password,
            role: 'unit',          // ← was 'user'
            createdBy: req.user.id, // ← track which Admin created this unit
            driveFolderId: driveFolderId,
            bankStatementsFolderId: bankStatementsFolderId,
            brFolderId: brFolderId
        });

        await newUser.save();
        res.json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get All Units (Admin sees only its own; Superadmin sees all)
router.get('/users', auth, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    try {
        let query = {
            role: { $in: ['unit', 'user'] },
            username: { $nin: ['Admin', 'ADMIN'] }
        };
        // Admin sees only units it created
        if (req.user.role === 'admin') {
            query.createdBy = req.user.id;
        }
        const users = await User.find(query).select('username companyName loginCode createdAt role createdBy');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Change own password — for Admin first-login
router.post('/change-password', auth, async (req, res) => {
    const { newCode } = req.body;
    if (!newCode || newCode.length !== 6 || !/^\d{6}$/.test(newCode)) {
        return res.status(400).json({ message: 'New code must be exactly 6 digits' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.loginCode = newCode;
        user.isFirstLogin = false;
        await user.save();
        res.json({ ok: true, message: 'Access code updated successfully' });
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});

// Reassign units to a different Admin (Superadmin only)
router.post('/reassign-units', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    const { unitUsernames, toAdminId, assignUnowned } = req.body;
    if (!toAdminId) return res.status(400).json({ message: 'toAdminId required' });
    try {
        const admin = await User.findOne({ _id: toAdminId, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Target admin not found' });

        let filter = { role: { $in: ['unit', 'user'] } };
        if (assignUnowned) {
            // Assign all units with no owner
            filter.createdBy = null;
        } else if (unitUsernames && unitUsernames.length > 0) {
            filter.username = { $in: unitUsernames };
        } else {
            return res.status(400).json({ message: 'unitUsernames[] or assignUnowned required' });
        }

        const result = await User.updateMany(filter, { $set: { createdBy: admin._id } });
        res.json({ ok: true, updated: result.modifiedCount, toAdmin: admin.username });
    } catch (err) { res.status(500).json({ message: 'Server Error', error: err.message }); }
});

// List unassigned units (no createdBy) — Superadmin only
router.get('/unassigned-units', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    try {
        const units = await User.find({
            role: { $in: ['unit', 'user'] },
            $or: [{ createdBy: null }, { createdBy: { $exists: false } }]
        }).select('username companyName loginCode createdAt brFolderId role');
        res.json(units);
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
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
                companyCode: userOverdrive.companyCode,
                driveFolderId: userOverdrive.driveFolderId
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

            // Determine access level for frontend routing
            let accessLevel = 'granted';
            if (userOverdrive.role === 'superadmin') accessLevel = 'superadmin';
            else if (userOverdrive.role === 'admin') accessLevel = 'admin';

            return res.json({
                access: accessLevel,
                token,
                user: {
                    id: userOverdrive._id,
                    username: userOverdrive.username,
                    role: userOverdrive.role,
                    companyCode: userOverdrive.companyCode,
                    driveFolderId: userOverdrive.driveFolderId
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

// ── SUPERADMIN ROUTES ─────────────────────────────────────────────────────────

// Create Admin (Superadmin only)
router.post('/create-admin', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    const { username, companyName, loginCode } = req.body;
    if (!username || !loginCode) return res.status(400).json({ message: 'Username and Access Code required' });
    try {
        const existing = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existing) return res.status(400).json({ message: 'Username already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ggmt1235#', salt);

        const { createFolder, findFolder } = require('../services/googleDrive');
        const driveRoot = process.env.GOOGLE_DRIVE_FOLDER_ID || "1Z56h5vAURMvM0Dad9zmcLjO8zeM5AoJf";
        let driveFolderId = null, brFolderId = null, bankStatementsFolderId = null;
        try {
            let existingFolder = await findFolder(username, driveRoot);
            if (!existingFolder) { const f = await createFolder(username, driveRoot); driveFolderId = f.id; }
            else driveFolderId = existingFolder.id;
            if (driveFolderId) {
                let bsSub = await findFolder('bank statements', driveFolderId);
                if (!bsSub) bsSub = await createFolder('bank statements', driveFolderId);
                bankStatementsFolderId = bsSub.id;
                let brSub = await findFolder('BR', driveFolderId);
                if (!brSub) brSub = await createFolder('BR', driveFolderId);
                brFolderId = brSub.id;
            }
        } catch (driveErr) { console.warn('[SA] Drive init warning:', driveErr.message); }

        const newAdmin = new User({
            username,
            companyName: companyName || username,
            companyCode: username.toUpperCase().replace(/\s+/g, '_'),
            password: hashedPassword,
            loginCode,
            role: 'admin',
            isFirstLogin: true,   // ← Admin must change code on first login
            driveFolderId,
            bankStatementsFolderId,
            brFolderId,
            createdBy: req.user.id,
        });
        await newAdmin.save();
        res.json(newAdmin);
    } catch (err) {
        console.error('[SA create-admin]', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// List all Admins (Superadmin only)
router.get('/admins', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    try {
        const admins = await User.find({ role: 'admin' }).select('username companyName loginCode createdAt driveFolderId');
        // Attach unit counts
        const result = await Promise.all(admins.map(async (a) => {
            const unitCount = await User.countDocuments({ createdBy: a._id, role: { $in: ['unit', 'user'] } });
            return { ...a.toObject(), unitCount };
        }));
        res.json(result);
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});

// List Units of a specific Admin (Superadmin drill-in)
router.get('/admins/:id/units', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    try {
        const units = await User.find({ createdBy: req.params.id, role: { $in: ['unit', 'user'] } })
            .select('username companyName loginCode createdAt brFolderId');
        res.json(units);
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});

// Update Admin (Superadmin only)
router.put('/admins/:id', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    const { companyName, loginCode } = req.body;
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        if (companyName) admin.companyName = companyName;
        if (loginCode) admin.loginCode = loginCode;
        await admin.save();
        res.json(admin);
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});

// Delete Admin (Superadmin only)
router.delete('/admins/:id', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin deleted' });
    } catch (err) { res.status(500).json({ message: 'Server Error' }); }
});

module.exports = router;
