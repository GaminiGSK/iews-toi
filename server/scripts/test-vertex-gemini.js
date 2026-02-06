const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');

async function testVertex() {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../config/service-account.json');

    const vertexAI = new VertexAI({ project: 'ambient-airlock-286506', location: 'us-central1' });
    const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });

    console.log("Testing Vertex AI Gemini...");

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Hello, verify Vertex AI.' }] }]
        });
        const response = await result.response;
        console.log("Success! Response:", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Vertex AI Error:", e.message);
        if (e.message.includes('not enabled')) {
            console.log("ACTION REQUIRED: Enable Vertex AI API in GCP Console.");
        }
    }
}

testVertex();
