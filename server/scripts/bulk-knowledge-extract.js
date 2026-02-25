const { google } = require('googleapis');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function bulkExtract() {
    const folders = [
        { name: 'Financial_Statement_preperation', id: '1at2rQXWw38_0VE0ze_yOZtE8XnPU2-nO' },
        { name: 'Book_keeping_knowledge', id: '1fUQCFf1LLFb8krzBMoB6RFYu6YEvdVNB' },
        { name: 'TOI_FOAM', id: '1fwscsWO7cyuW7rAthUQz-sFDhZIjeDJW' }
    ];

    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const baseDir = path.resolve(__dirname, '../../knowledge/extracted');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    for (const folder of folders) {
        console.log(`\n🚀 Starting extraction for: ${folder.name}`);
        const folderPath = path.join(baseDir, folder.name);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

        const res = await drive.files.list({
            q: `'${folder.id}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            pageSize: 30
        });

        for (const file of res.data.files) {
            const outputPath = path.join(folderPath, `${file.name}.md`);
            if (fs.existsSync(outputPath)) {
                console.log(`⏩ Skipping ${file.name} (Already exists)`);
                continue;
            }

            console.log(`📥 Downloading ${file.name}...`);
            const tempPath = path.join(__dirname, `temp_${file.id}${path.extname(file.name)}`);
            const dest = fs.createWriteStream(tempPath);

            try {
                const driveRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'stream' });
                await new Promise((resolve, reject) => {
                    driveRes.data
                        .on('end', () => resolve())
                        .on('error', err => reject(err))
                        .pipe(dest);
                });

                console.log(`🧠 AI Extracting ${file.name}...`);
                const imageBuffer = fs.readFileSync(tempPath);
                const result = await model.generateContent([
                    "You are a professional accountant and tax expert. Extract all readable text and data from this document. If it is a table, format it as a Markdown table. Maintain the original structure. Provide a clean Markdown output.",
                    {
                        inlineData: {
                            data: imageBuffer.toString("base64"),
                            mimeType: file.mimeType
                        }
                    }
                ]);

                fs.writeFileSync(outputPath, result.response.text());
                console.log(`✅ Saved: ${outputPath}`);
            } catch (err) {
                console.error(`❌ Error processing ${file.name}:`, err.message);
            } finally {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
        }
    }
}

bulkExtract().catch(console.error);
