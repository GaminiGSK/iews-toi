const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');

const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, '../../knowledge/extracted');

// @desc    Get all knowledge categories and their files
// @route   GET /api/knowledge
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
            return res.json([]);
        }

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

            return {
                id: cat,
                name: cat.replace(/_/g, ' '),
                fileCount: files.length,
                files: files
            };
        });

        res.json(result);
    } catch (err) {
        console.error('[KnowledgeRoute] Error:', err);
        res.status(500).json({ message: 'Error retrieving knowledge base' });
    }
});

// @desc    Get content of a specific knowledge file
// @route   GET /api/knowledge/:category/:fileName
// @access  Private/Admin
router.get('/:category/:fileName', protect, admin, async (req, res) => {
    try {
        const { category, fileName } = req.params;
        const filePath = path.join(KNOWLEDGE_BASE_DIR, category, fileName);

        if (!fs.existsSync(filePath) || !filePath.startsWith(KNOWLEDGE_BASE_DIR)) {
            return res.status(404).json({ message: 'File not found' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content });
    } catch (err) {
        console.error('[KnowledgeRoute] Error reading file:', err);
        res.status(500).json({ message: 'Error reading knowledge file' });
    }
});

module.exports = router;
