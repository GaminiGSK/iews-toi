const express = require('express');
const router = express.Router();
const Bridge = require('../models/Bridge');

// POST data to the bridge (External calls this)
router.post('/send', async (req, res) => {
    try {
        const { source, type, content, secret } = req.body;
        if (process.env.BRIDGE_SECRET && secret !== process.env.BRIDGE_SECRET) {
            return res.status(401).json({ message: 'Unauthorized bridge access' });
        }
        const bridgeEntry = new Bridge({ source, type, content });
        await bridgeEntry.save();
        res.json({ message: 'Data bridged successfully', id: bridgeEntry._id });
    } catch (err) {
        res.status(500).json({ message: 'Bridge failure' });
    }
});

// GET unread bridge entries (Antigravity calls this)
router.get('/unread', async (req, res) => {
    try {
        const secret = req.headers['x-bridge-secret'];
        if (process.env.BRIDGE_SECRET && secret !== process.env.BRIDGE_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const entries = await Bridge.find({ status: 'unread' }).sort({ createdAt: 1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch' });
    }
});

// GET latest bridge entries (External calls this to see status updates)
router.get('/latest', async (req, res) => {
    try {
        const secret = req.headers['x-bridge-secret'];
        if (process.env.BRIDGE_SECRET && secret !== process.env.BRIDGE_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const entries = await Bridge.find().sort({ createdAt: -1 }).limit(10);
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch latest' });
    }
});

// Mark entry as acknowledged
router.post('/acknowledge/:id', async (req, res) => {
    try {
        await Bridge.findByIdAndUpdate(req.params.id, { status: 'acknowledged' });
        res.json({ message: 'Acknowledged' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

module.exports = router;
