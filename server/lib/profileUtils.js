const googleDrive = require('../services/googleDrive');

/**
 * Heals missing data and normalizes docTypes for a company profile.
 * Returns true if the profile was modified and needs saving.
 */
async function healAndNormalizeProfile(profile) {
    let modified = false;

    if (!profile.documents || !Array.isArray(profile.documents)) return false;

    for (const doc of profile.documents) {
        // 1. NORMALIZATION: Map generic types to specific dossier categories
        if (doc.docType === 'br_extraction' || doc.docType === 'br_extra' || !doc.docType) {
            const name = (doc.originalName || "").toLowerCase();
            let newType = doc.docType || 'br_extra';

            if (name.includes('cert') || name.includes('incorporation')) newType = 'moc_cert';
            else if (name.includes('khmer') || name.includes('khemer') || (name.includes('extract') && name.includes('kh'))) newType = 'kh_extract';
            else if (name.includes('english') || (name.includes('extract') && name.includes('en'))) newType = 'en_extract';
            else if (name.includes('patent')) newType = 'tax_patent';
            else if (name.includes('vat') || name.includes('tax id')) newType = 'tax_id';
            else if (name.includes('bank') || name.includes('opening')) newType = 'bank_opening';

            if (newType !== doc.docType) {
                console.log(`[Normalization] Mapping ${doc.originalName} -> ${newType}`);
                doc.docType = newType;
                modified = true;
            }
        }

        // 2. RECORD HEALING: Recover missing Base64 data from Google Drive
        if (!doc.data && doc.path && doc.path.startsWith('drive:')) {
            const driveId = doc.path.split(':')[1];
            try {
                console.log(`[Heal] Automatically restoring wiped data for: ${doc.originalName} (${driveId})`);

                // Get stream from Drive
                const stream = await googleDrive.getFileStream(driveId);

                // Buffer the stream to Base64
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);
                doc.data = buffer.toString('base64');
                modified = true;

                console.log(`[Heal] Success: ${doc.originalName} restored to DB.`);
            } catch (err) {
                console.error(`[Heal] Critical Failure for ${doc.originalName}:`, err.message);
                // If it fails, we keep going - don't block the profile load
            }
        }
    }

    return modified;
}

module.exports = { healAndNormalizeProfile };
