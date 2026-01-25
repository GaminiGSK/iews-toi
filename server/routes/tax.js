const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const TaxTemplate = require('../models/TaxTemplate');
const fs = require('fs');
const path = require('path');

// Upload Tax Templates (Bulk)
router.post('/templates', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const savedTemplates = [];

        for (const file of files) {
            // Create Template Record
            const template = new TaxTemplate({
                name: file.originalname,
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                type: file.mimetype,
                size: file.size,
                status: 'New'
            });
            await template.save();
            savedTemplates.push(template);
        }

        res.json({ message: 'Files uploaded successfully', templates: savedTemplates });
    } catch (err) {
        console.error('Error uploading tax templates:', err);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

// Update Mappings (Save Configuration)
router.put('/templates/:id', async (req, res) => {
    try {
        const { mappings } = req.body;
        const template = await TaxTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        template.mappings = mappings;
        template.status = 'Configured';
        await template.save();

        res.json({ message: 'Mappings saved', template });
    } catch (err) {
        console.error('Error saving mappings:', err);
        res.status(500).send('Server Error');
    }
});

// Get All Templates
router.get('/templates', async (req, res) => {
    try {
        const templates = await TaxTemplate.find().sort({ createdAt: 1 });
        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

const googleAI = require('../services/googleAI');

// Analyze Template (AI Auto-Scan)
router.post('/templates/:id/analyze', async (req, res) => {
    try {
        const template = await TaxTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        if (!template.path || !fs.existsSync(template.path)) {
            return res.status(400).json({ message: 'Template file not found on server' });
        }

        console.log(`Starting AI Analysis for ${template.name}...`);
        const aiMappings = await googleAI.analyzeTaxForm(template.path);

        // Convert to our Schema format
        const newMappings = aiMappings.map((m, index) => ({
            id: Date.now() + index,
            label: m.label || `Field ${index + 1}`,
            x: m.x,
            y: m.y,
            w: m.w,
            h: m.h,
            semanticLabel: m.label // Store the AI's semantic label
        }));

        // Merge with existing? Or overwrite? Overwrite for now as it's an "Analyze" action.
        template.mappings = newMappings;
        template.status = 'Configured';
        await template.save();

        res.json({ message: 'Analysis Complete', mappings: newMappings });
    } catch (err) {
        console.error('Error analyzing template:', err);
        res.status(500).json({ message: 'AI Analysis Failed' });
    }
});

// Serve Template File
router.get('/file/:filename', (req, res) => {
    const useLocal = !fs.existsSync('/tmp');
    const activeDir = useLocal ? path.join(__dirname, '../uploads') : '/tmp';
    const filePath = path.join(activeDir, req.params.filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

module.exports = router;
