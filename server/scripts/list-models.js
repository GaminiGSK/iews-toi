const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const key = process.env.GEMINI_API_KEY;

async function list() {
    try {
        console.log("Listing models via REST (fetch)...");
        if (!key) {
            console.error("No API key found in .env");
            return;
        }
        console.log("Using Key from .env ending in:", key.substring(key.length - 5));
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
        const data = await res.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:");
            const models = data.models || [];
            for (let i = 0; i < models.length; i++) {
                const m = models[i];
                if (m.name.toLowerCase().indexOf('flash') !== -1) {
                    console.log("- " + m.name + " [" + m.supportedGenerationMethods.join(',') + "]");
                }
            }
        }
    } catch (e) {
        console.error("Network Error:", e);
    }
}
list();
