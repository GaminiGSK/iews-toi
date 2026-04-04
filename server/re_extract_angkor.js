const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BankFile = require('./models/BankFile');
const Transaction = require('./models/Transaction');
const driveService = require('./services/googleDrive');
const googleAI = require('./services/googleAI');

async function reExtractAngkor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("=== Connected to MongoDB for Deep Extraction ===\n");

        const files = await BankFile.find({ companyCode: 'ANGKOR' });
        console.log(`Found ${files.length} BankFiles for ANGKOR.`);

        for (const file of files) {
            if (!file.driveId) {
                console.log(`[SKIP] Missing driveId for: ${file.originalName}`);
                continue;
            }

            // Check if Transactions already exist
            const txCount = await Transaction.countDocuments({ 'originalData.driveId': file.driveId, companyCode: 'ANGKOR' });
            if (txCount > 0) {
                console.log(`[SKIP] Already extracted ${txCount} txs for: ${file.originalName}`);
                continue;
            }

            console.log(`\n➡ RE-EXTRACTING: ${file.originalName}`);
            
            // Determine Extension
            const ext = path.extname(file.originalName || ".pdf");
            const tmpPath = path.join(__dirname, `re_extract_tmp_${Date.now()}${ext}`);
            
            try {
                // 1. Download Stream
                const stream = await driveService.getFileStream(file.driveId);
                const writeStream = fs.createWriteStream(tmpPath);
                
                await new Promise((resolve, reject) => {
                    stream.pipe(writeStream);
                    stream.on('end', resolve);
                    stream.on('error', reject);
                    writeStream.on('error', reject);
                    writeStream.on('finish', resolve);
                });
                
                // 2. Extract using AI
                console.log(`   [AI] Sending to Advanced OCR Engine... (this takes 15-40s)`);
                let rawExtracted = await googleAI.extractBankStatement(tmpPath);
                let extracted = [];
                
                if (rawExtracted && !Array.isArray(rawExtracted) && rawExtracted.transactions) {
                    extracted = rawExtracted.transactions;
                } else if (Array.isArray(rawExtracted)) {
                    extracted = rawExtracted;
                }
                
                console.log(`   [AI] Done. Extracted ${extracted.length} raw transactions.`);
                
                // 3. Save to Ledger
                let actualSavedCount = 0;
                if (extracted.length > 0) {
                    extracted.sort((a, b) => new Date(a.date) - new Date(b.date));
                    extracted = extracted.map((tx, idx) => ({ ...tx, sequence: idx, driveId: file.driveId, fileId: file.originalName }));

                    const savedDocs = [];
                    for (const tx of extracted) {
                        if (tx.date === "DEBUG_ERR" || tx.date === "FATAL_ERR" || (tx.description && tx.description.includes("AI Parse Failed"))) {
                            continue;
                        }

                        const parseCurrency = (val) => {
                            if (!val) return 0;
                            const clean = String(val).replace(/[^0-9.-]/g, '');
                            return parseFloat(clean) || 0;
                        };

                        let amount = 0;
                        const inVal = parseCurrency(tx.moneyIn);
                        const outVal = parseCurrency(tx.moneyOut);
                        if (inVal > 0) amount = inVal;
                        if (outVal > 0) amount = -outVal;

                        const parseDate = (dateStr) => {
                            if (!dateStr) return new Date();
                            if (dateStr instanceof Date) return dateStr;
                            const parts = String(dateStr).split('/');
                            if (parts.length === 3) {
                                const day = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const year = parseInt(parts[2], 10);
                                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return new Date(Date.UTC(year, month, day));
                            }
                            const parsed = new Date(dateStr);
                            return isNaN(parsed.getTime()) ? new Date() : parsed;
                        };

                        savedDocs.push({
                            user: file.user,
                            companyCode: file.companyCode,
                            date: parseDate(tx.date),
                            description: tx.description,
                            amount: amount,
                            balance: parseCurrency(tx.balance),
                            currency: 'USD',
                            sequence: tx.sequence || 0,
                            originalData: tx
                        });
                    }

                    if (savedDocs.length > 0) {
                        await Transaction.insertMany(savedDocs);
                        actualSavedCount = savedDocs.length;
                        console.log(`   [DB] Inserted ${actualSavedCount} real transactions into Ledger.`);
                    }
                    
                    // Update the BankFile to show UI
                    await BankFile.updateOne(
                        { _id: file._id },
                        { transactionCount: actualSavedCount, status: 'Processed' }
                    );
                }

                if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); // Cleanup
            } catch (err) {
                console.error(`   [Error] Failed processing ${file.originalName}:`, err.message);
                if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
            }
        }
        
        console.log("\n✅ ALL ANGKOR FILES PROCESSED SUCCESSFULLY!");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ FATAL SCRIPT ERROR:", err);
        process.exit(1);
    }
}

reExtractAngkor();
