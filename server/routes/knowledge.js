const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { isSuperadmin, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const googleAI = require('../services/googleAI');
const { uploadFile } = require('../services/googleDrive');

const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, '../../knowledge/extracted');
const KnowledgeFile = require('../models/KnowledgeFile');
const KnowledgeDocument = require('../models/KnowledgeDocument');

// ── SUPERADMIN KNOWLEDGE VAULT ROUTES ─────────────────────────────────────────

// GET /api/knowledge/documents -> Fetch structured MongoDB intelligence
router.get('/documents', auth, async (req, res) => {
    if (!isSuperadmin(req)) return res.status(403).json({ message: 'Superadmin only' });
    try {
        const docs = await KnowledgeDocument.find().sort({ uploadedAt: -1 }).lean();
        res.json(docs);
    } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

// POST /api/knowledge/ingest-law -> Dual Upload pipeline (Drive + Mongo/OCR)
router.post('/ingest-law', auth, upload.single('file'), async (req, res) => {
    if (!isSuperadmin(req)) return res.status(403).json({ message: 'Superadmin only' });
    try {
        const category = req.body.category || 'TAX_LAW';
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'No file provided' });

        // 1. OCR Extraction via Gemini
        const aiAnalysis = await googleAI.analyzeTaxLaw(file.path);

        // 2. Google Drive Archival
        let driveFileId = null;
        try {
            const superKnowledgeFolderId = process.env.SUPER_KNOWLEDGE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
            if (superKnowledgeFolderId) {
                const driveRes = await uploadFile(file.path, file.mimetype, file.originalname, superKnowledgeFolderId);
                driveFileId = (typeof driveRes === 'object') ? driveRes.id : driveRes;
            }
        } catch (driveErr) {
            console.error("[Knowledge] Drive archival failed:", driveErr.message);
        }

        // 3. Mongo Intelligence Storage
        const newLaw = new KnowledgeDocument({
            title: req.body.title || file.originalname.split('.')[0].replace(/_/g, ' '),
            category: category,
            originalFileName: file.originalname,
            originalTextKhmer: aiAnalysis.originalTextKhmer || 'Extracted text failed.',
            translatedEnglish: aiAnalysis.translatedEnglish || 'Translation failed.',
            structuredRules: aiAnalysis.structuredRules || {},
            driveFileId: driveFileId,
            dateIssued: aiAnalysis.structuredRules?.documentDate ? new Date(aiAnalysis.structuredRules.documentDate) : new Date()
        });
        await newLaw.save();

        // 4. Cleanup temp file
        fs.unlink(file.path, () => {});

        res.json({ message: 'Knowledge Ingested Successfully', doc: newLaw });
    } catch (err) {
        console.error('[Knowledge Ingest]', err);
        if (req.file) fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: err.message });
    }
});

// GET /api/knowledge/files  — List old KnowledgeFile synced items
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



// Delete a Knowledge Document
router.delete('/documents/:id', auth, async (req, res) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ message: 'Superadmin only' });
    try {
        const doc = await KnowledgeDocument.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        
        await KnowledgeDocument.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('[DELETE /knowledge/documents]', err);
        res.status(500).json({ message: 'Server Error' });
    }
});
module.exports = router;
