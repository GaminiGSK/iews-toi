const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
const path = require('path');

async function listProcessors() {
    const keyPath = path.join(__dirname, '../config/service-account.json');
    const projectId = 'ambient-airlock-286506';
    const location = 'us'; // Default location

    const client = new DocumentProcessorServiceClient({
        keyFilename: keyPath
    });

    const parent = `projects/${projectId}/locations/${location}`;

    console.log(`Listing processors for ${parent}...`);

    try {
        const [processors] = await client.listProcessors({ parent });
        console.log('Processors:');
        processors.forEach(processor => {
            console.log(`- Name: ${processor.name}`);
            console.log(`  Type: ${processor.type}`);
            console.log(`  Display Name: ${processor.displayName}`);
        });
        if (processors.length === 0) {
            console.log('No processors found in us. Trying eu...');
            const parentEu = `projects/${projectId}/locations/eu`;
            const [processorsEu] = await client.listProcessors({ parent: parentEu });
            processorsEu.forEach(p => console.log(`- ${p.displayName} (${p.name})`));
        }
    } catch (e) {
        console.error('Error listing processors:', e.message);
        if (e.message.includes('not enabled')) {
            console.log('ACTION: Enable Document AI API at https://console.cloud.google.com/apis/library/documentai.googleapis.com');
        }
    }
}

listProcessors();
