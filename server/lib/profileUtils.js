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
        // 2. We NO LONGER store large Base64 clusters in MongoDB to prevent hitting the 16MB limit.
        // Google Drive is the sole physical asset repository (Drive-First Policy).
        if (doc.data) {
            console.log(`[Normalization] Purging legacy DB Base64 blob for: ${doc.originalName} to prevent storage limit crash.`);
            doc.data = undefined;
            modified = true;
        }
    }

    if (modified) profile.markModified('documents');

    return modified;
}

module.exports = { healAndNormalizeProfile };
