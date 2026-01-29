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
        // Sort files by original name to maintain sequence (e.g., page1, page2...)
        const sortedFiles = [...files].sort((a, b) => a.originalname.localeCompare(b.originalname, undefined, { numeric: true }));

        for (let i = 0; i < sortedFiles.length; i++) {
            const file = sortedFiles[i];
            // Read File Content as Base64 for Persistence
            const fileBuffer = fs.readFileSync(file.path);
            const base64Data = fileBuffer.toString('base64');

            // Create Template Record
            const template = new TaxTemplate({
                name: file.originalname,
                groupName: 'TOI-01',
                pageNumber: i + 1, // Auto-sequence page 1, 2, 3...
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                type: file.mimetype,
                size: file.size,
                data: base64Data, // Store in DB
                status: 'New'
            });
            await template.save();
            savedTemplates.push(template);

            // Clean up temp file (Optional, but good for Cloud)
            try { fs.unlinkSync(file.path); } catch (e) { }
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
        // Exclude 'data' field to keep list lightweight
        const templates = await TaxTemplate.find().select('-data').sort({ createdAt: 1 });
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

        // Restore file from Base64 for AI processing
        let tempFilePath = template.path;
        // Logic to write temp file if missing
        if (!fs.existsSync(tempFilePath)) {
            try {
                // Determine a safe temp path
                // If template.data exists, write it.
                if (template.data) {
                    const useLocal = !fs.existsSync('/tmp');
                    const tempDir = useLocal ? path.join(__dirname, '../uploads') : '/tmp';
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                    tempFilePath = path.join(tempDir, template.filename);
                    fs.writeFileSync(tempFilePath, Buffer.from(template.data, 'base64'));
                } else {
                    return res.status(400).json({ message: 'Template content missing.' });
                }
            } catch (e) {
                console.error("Failed to write temp file for AI", e);
                return res.status(500).json({ message: 'Server Write Failure' });
            }
        }

        console.log(`Starting AI Analysis for ${template.name}...`);
        const aiMappings = await googleAI.analyzeTaxForm(tempFilePath);

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
router.get('/file/:filename', async (req, res) => {
    try {
        const template = await TaxTemplate.findOne({ filename: req.params.filename });
        if (!template || !template.data) {
            return res.status(404).send('File not found');
        }

        const imgBuffer = Buffer.from(template.data, 'base64');
        res.type(template.type || 'image/jpeg');
        res.send(imgBuffer);
    } catch (e) {
        console.error("Error serving file:", e);
        res.status(500).send("Error serving file");
    }
});

// Delete Template
router.delete('/templates/:id', async (req, res) => {
    try {
        const template = await TaxTemplate.findById(req.params.id);
        if (!template) return res.status(404).send('Template not found');

        await TaxTemplate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- Tax Packages (TOI) Persistence ---
const TaxPackage = require('../models/TaxPackage');

// Get All Packages
router.get('/packages', async (req, res) => {
    try {
        const packages = await TaxPackage.find().sort({ year: -1 });
        res.json(packages);
    } catch (err) {
        console.error("Error fetching packages:", err);
        res.status(500).send("Server Error");
    }
});

// Create Package
router.post('/packages', async (req, res) => {
    try {
        const { year } = req.body;
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const existing = await TaxPackage.findOne({ year });
        if (existing) return res.status(400).json({ message: 'Package for this year already exists' });

        const newPackage = new TaxPackage({
            year,
            status: 'Draft',
            progress: 0
        });

        await newPackage.save();
        res.json(newPackage);
    } catch (err) {
        console.error("Error creating package:", err);
        res.status(500).send("Server Error");
    }
});

// Get Single Package by Year
router.get('/packages/:year', async (req, res) => {
    try {
        const pkg = await TaxPackage.findOne({ year: req.params.year });
        if (!pkg) return res.status(404).json({ message: 'Package not found' });
        res.json(pkg);
    } catch (err) {
        console.error("Error fetching package:", err);
        res.status(500).send("Server Error");
    }
});

// Update Package Data
router.put('/packages/:year', async (req, res) => {
    try {
        const { data } = req.body;
        const pkg = await TaxPackage.findOne({ year: req.params.year });
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        // Merge Data
        if (data) {
            for (let [key, val] of Object.entries(data)) {
                pkg.data.set(key, val);
            }
        }

        await pkg.save();
        res.json(pkg);
    } catch (err) {
        console.error("Error updating package:", err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
