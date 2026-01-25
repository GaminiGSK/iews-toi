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

module.exports = router;
