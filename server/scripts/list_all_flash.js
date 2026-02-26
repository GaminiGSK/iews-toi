const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const key = process.env.GEMINI_API_KEY;

async function list() {
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
        const data = await res.json();
        if (data.models) {
            for (let i = 0; i < data.models.length; i++) {
                if (data.models[i].name.toLowerCase().indexOf('flash') !== -1) {
                    console.log(data.models[i].name);
                }
            }
        }
    } catch (e) { }
}
list();
