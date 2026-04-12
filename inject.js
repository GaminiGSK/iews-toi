const fs = require('fs');
let content = fs.readFileSync('e:/Antigravity/TOI/server/services/googleAI.js', 'utf8');

const analyzeTaxLawCode = `
exports.analyzeTaxLaw = async (filePath) => {
    console.log('[GeminiAI] Analyzing Tax Law structured JSON:', filePath);
    try {
        const prompt = \`You are a Senior Tax Auditor & Legal Analyst for the General Department of Taxation (GDT) of Cambodia.
Analyze this official document. Extract and translate the text, and distill the operative "hard rules" while ignoring administrative preambles.
Provide a JSON response strictly matching this structure:
{
  "originalTextKhmer": "The exact verbatim text transcribed from the document in Khmer. Do not omit the official letterhead, stamps, or preamble.",
  "translatedEnglish": "A professional, highly accurate English translation of the document. Use precise legal/tax terminology.",
  "structuredRules": {
    "documentNumber": "If found, e.g., '1234 GDT'",
    "documentDate": "If found, e.g., '12 May 2024'",
    "subject": "The core topic or title of the circular/law",
    "hardRules": [
       "Extracted operational rule 1 (clear, actionable, ignore noise)",
       "Extracted operational rule 2"
    ]
  }
}
Return ONLY valid JSON. No markdown code blocks, no explanations.\`;

        const path = require('path');
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';
        if (ext === '.webp') mimeType = 'image/webp';

        const filePart = fileToGenerativePart(filePath, mimeType);
        const result = await callGeminiWithRetry(() => getModel().generateContent([prompt, filePart]));
        let responseText = result.response.text();
        
        return cleanAndParseJSON(responseText) || {
            originalTextKhmer: "Failed to parse JSON, falling back to raw text.",
            translatedEnglish: "Failed to extract translations.",
            structuredRules: {}
        };
    } catch (error) {
        console.error("Gemini API Error (Tax Law Analysis):", error);
        throw error;
    }
};
`;

content = content.replace(/exports\.extractFromBuffer = async/, analyzeTaxLawCode + "\nexports.extractFromBuffer = async");
fs.writeFileSync('e:/Antigravity/TOI/server/services/googleAI.js', content, 'utf8');

let knowledge = fs.readFileSync('e:/Antigravity/TOI/server/routes/knowledge.js', 'utf8');
knowledge = knowledge.replace(/const rawKhmer = await googleAI\.extractRawText\(file\.path\);/, 'const aiAnalysis = await googleAI.analyzeTaxLaw(file.path);');
knowledge = knowledge.replace(/originalTextKhmer: rawKhmer \|\| 'Extracted text pending or failed\.',\s*translatedEnglish: 'Pending Translation\.\.\.',\s*structuredRules: \{\},/s, 
`originalTextKhmer: aiAnalysis.originalTextKhmer || 'Extracted text failed.',
            translatedEnglish: aiAnalysis.translatedEnglish || 'Translation failed.',
            structuredRules: aiAnalysis.structuredRules || {},`);

knowledge = knowledge.replace(/dateIssued: new Date\(\)/, `dateIssued: aiAnalysis.structuredRules?.documentDate ? new Date(aiAnalysis.structuredRules.documentDate) : new Date()`);
fs.writeFileSync('e:/Antigravity/TOI/server/routes/knowledge.js', knowledge, 'utf8');
