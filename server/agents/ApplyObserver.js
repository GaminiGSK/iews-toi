const mongoose = require('mongoose');
const TaxTemplate = require('../models/TaxTemplate');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iews_toi';
        await mongoose.connect(connStr);
        console.log(`[Observer Agent] DB Connected.`);
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
};

async function runObserverAgent() {
    await connectDB();

    try {
        console.log(`[Observer Agent] Self-Healing Protocol Initiated...`);

        // 1. Read the blueprint from Phase 1
        const schemaPath = path.join(__dirname, 'latest_schema.json');
        if (!fs.existsSync(schemaPath)) {
            console.error("No Blueprint found.");
            return;
        }
        const schemaData = JSON.parse(fs.readFileSync(schemaPath)).schema;

        // 2. Transform Schema to Database Model
        console.log(`[Observer Agent] Translating Semantic Schema to Visual Mappings...`);
        const newMappings = schemaData.map(s => {
            // Robust check for bounding box
            const box = s.bounding_box || {};
            // If Vision Agent missed coordinate, use safe default or previous
            return {
                id: s.id,
                label: s.label,
                semanticLabel: s.intent || s.label, // Semantic Brain
                x: box.x || 0,
                y: box.y || 0,
                w: box.w || 10,
                h: box.h || 5,
                linkedCode: s.logic || '' // Logic instructions
            };
        });

        // 3. Heal the Database
        const template = await TaxTemplate.findOne().sort({ createdAt: -1 });
        if (!template) {
            console.error("No Template to Heal.");
            return;
        }

        console.log(`[Observer Agent] Applying mutations to Template: ${template.name}`);
        template.mappings = newMappings;
        template.status = 'Active'; // Live
        await template.save();

        console.log(`[Observer Agent] Mutation Complete. System Healed.`);
        console.log(`[Observer Agent] ${newMappings.length} interactive fields are now live.`);

    } catch (err) {
        console.error("Observer Failed:", err);
    } finally {
        mongoose.disconnect();
    }
}

runObserverAgent();
