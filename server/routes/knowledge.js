const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { isSuperadmin, isAdmin } = require('../middleware/auth');

const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, '../../knowledge/extracted');
const KnowledgeFile = require('../models/KnowledgeFile');

// ── SUPERADMIN KNOWLEDGE VAULT ROUTES ─────────────────────────────────────────

// GET /api/knowledge/files  — List all knowledge PDF files
router.get('/files', auth, async (req, res) => {
    if (!isSuperadmin(req)) return res.status(403).json({ message: 'Superadmin only' });
    try {
        const files = await KnowledgeFile.find().sort({ createdAt: -1 }).lean();
        res.json(files);
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// GET /api/knowledge/status  — Sync status summary
router.get('/status', auth, async (req, res) => {
    if (!isSuperadmin(req)) return res.status(403).json({ message: 'Superadmin only' });
    try {
        const total = await KnowledgeFile.countDocuments();
        const active = await KnowledgeFile.countDocuments({ isActive: true });
        const pending = await KnowledgeFile.countDocuments({ readAt: null });
        const lastSyncDoc = await KnowledgeFile.findOne({ readAt: { $ne: null } }).sort({ readAt: -1 });
        res.json({ total, active, pending, lastSync: lastSyncDoc?.readAt || null });
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// POST /api/knowledge/sync  — Scan Google Drive Super Knowledge folder + index new PDFs
router.post('/sync', auth, async (req, res) => {
    if (!isSuperadmin(req)) return res.status(403).json({ message: 'Superadmin only' });
    try {
        const { listFilesInFolder } = require('../services/googleDrive');
        const superKnowledgeFolderId = process.env.SUPER_KNOWLEDGE_FOLDER_ID;
        if (!superKnowledgeFolderId) {
            return res.status(400).json({ message: 'SUPER_KNOWLEDGE_FOLDER_ID not configured' });
        }

        const driveFiles = await listFilesInFolder(superKnowledgeFolderId);
        let synced = 0;
        for (const file of driveFiles) {
            if (!file.name.toLowerCase().endsWith('.pdf')) continue;
            const existing = await KnowledgeFile.findOne({ driveFileId: file.id });
            if (!existing) {
                // Detect category from subfolder or filename
                let category = 'other';
                const name = file.name.toLowerCase();
                if (name.includes('tax_law') || name.includes('prakas') || name.includes('law')) category = 'tax_laws';
                else if (name.includes('circular') || name.includes('gdt')) category = 'gdt_circulars';
                else if (name.includes('toi') || name.includes('guide')) category = 'toi_guidelines';
                else if (name.includes('audit') || name.includes('cas') || name.includes('standard')) category = 'audit_standards';

                await KnowledgeFile.create({
                    filename: file.name,
                    driveFileId: file.id,
                    category,
                    isActive: true,
                    uploadedBy: 'superadmin'
                });
                synced++;
            }
        }
        res.json({ ok: true, synced, total: driveFiles.length });
    } catch (e) {
        console.error('[Knowledge Sync]', e.message);
        res.status(500).json({ message: 'Sync failed', error: e.message });
    }
});

// ── EXISTING ROUTES (kept for backward compat) ────────────────────────────────

// @route   GET /api/knowledge
router.get('/', auth, async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
        if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) return res.json([]);
        const categories = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter(f =>
            fs.statSync(path.join(KNOWLEDGE_BASE_DIR, f)).isDirectory()
        );
        const result = categories.map(cat => {
            const catPath = path.join(KNOWLEDGE_BASE_DIR, cat);
            const files = fs.readdirSync(catPath)
                .filter(f => f.endsWith('.md'))
                .map(f => ({
                    name: f.replace('.md', ''),
                    fileName: f,
                    size: fs.statSync(path.join(catPath, f)).size,
                    updatedAt: fs.statSync(path.join(catPath, f)).mtime
                }));
            return { id: cat, name: cat.replace(/_/g, ' '), fileCount: files.length, files };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving knowledge base' });
    }
});

// @route   GET /api/knowledge/:category/:fileName
router.get('/:category/:fileName', auth, async (req, res) => {
    try {
        if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
        const { category, fileName } = req.params;
        const filePath = path.join(KNOWLEDGE_BASE_DIR, category, fileName);
        if (!fs.existsSync(filePath) || !filePath.startsWith(KNOWLEDGE_BASE_DIR)) {
            return res.status(404).json({ message: 'File not found' });
        }
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ message: 'Error reading knowledge file' });
    }
});

module.exports = router;
