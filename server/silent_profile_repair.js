/**
 * silent_profile_repair.js
 * 
 * SAFE SILENT REPAIR — runs live against all units.
 * Rules:
 *   1. Reads every unit's own uploaded BR documents (rawText + organizedProfile)
 *   2. Extracts: companyNameEn, companyNameKh, director, registrationNumber, address, phone, email
 *   3. ONLY fills EMPTY fields — never overwrites existing data
 *   4. No server restart. No code change. No deployment.
 *   5. All done via standard API calls.
 */
const https = require('https');
const HOST = 'iews-toi-588941282431.asia-southeast1.run.app';

function req(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: HOST, path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const r = https.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ _raw: raw }); } });
        });
        r.on('error', reject);
        if (data) r.write(data);
        r.end();
    });
}

// ── Extractors ────────────────────────────────────────────────────────────────
function extract(text, ...patterns) {
    for (const p of patterns) {
        const m = text.match(p);
        if (m) {
            const val = (m[1] || m[2] || '').trim().replace(/\s+/g, ' ');
            if (val.length > 1) return val;
        }
    }
    return null;
}

function extractEnName(t) {
    return extract(t,
        /Company Name \(in English\)[:\s]+([^\n\r]+)/i,
        /Company Name \(English\)[:\s]+([^\n\r]+)/i,
        /Name \(in English\)[:\s]+([^\n\r]+)/i,
        /NAME[:\s]*\n?\s*([A-Z][A-Z\s&().,'-]{4,})/,
        /Legal Name[:\s]+([^\n/]+)/i,
    );
}

function extractKhName(t) {
    return extract(t,
        /Company Name \(in Khmer\)[:\s\n]+([^\n\r]+)/i,
        /Company Name \(Khmer\)[:\s\n]+([^\n\r]+)/i,
        /Name \(in Khmer\)[:\s\n]+([^\n\r]+)/i,
        /នាមករណ៍[:\s\n]+([^\n\r]+)/,
        /ឈ្មោះ[:\s\n]+([^\n\r]{4,})/,
    );
}

function extractDirector(t) {
    return extract(t,
        /Name \(in English\)[:\s]+([^\n\r]+)/i,
        /Director.*?:\s*([A-Z][a-zA-Z\s]+)/i,
        /Chairman.*?:\s*([A-Z][a-zA-Z\s]+)/i,
        /Proprietor.*?:\s*([A-Z][a-zA-Z\s]+)/i,
        /Owner.*?:\s*([A-Z][a-zA-Z\s]+)/i,
        /SHEIKH\s+\w+/i,
        /HE\s+[A-Z][A-Z\s]+/,
    );
}

function extractDirectorKh(t) {
    return extract(t,
        /Name \(in Khmer\)[:\s\n]+([^\n\r]{2,})/i,
        /នាយក[:\s\n]+([^\n\r]{2,})/,
        /ម្ចាស់[:\s\n]+([^\n\r]{2,})/,
    );
}

function extractReg(t) {
    return extract(t,
        /Registration Number[:\s]+([0-9A-Z-]{5,})/i,
        /Company Number[:\s]+([0-9]{7,})/i,
        /REG(?:ISTRATION)? NO?[.:\s]+([0-9]{7,})/i,
        /លេខ\s*(?:ចុះបញ្ជី)?[:\s]+([0-9]{7,})/,
    );
}

function extractAddress(t) {
    return extract(t,
        /(?:Physical|Registered) (?:Office )?Address[:\s]+([^\n\r]{10,})/i,
        /Address[:\s]+([^\n\r]{10,}(?:\n[^\n\r]{5,})?)/i,
    );
}

function extractEmail(t) {
    const m = t.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return m ? m[1] : null;
}

function extractPhone(t) {
    return extract(t,
        /(?:Tel|Phone|Telephone)[:\s]+([+\d\s()-]{7,})/i,
        /(\+855[\s\d()-]{8,})/,
        /(\+\d{1,3}[\s\d()-]{8,})/,
    );
}

// Also mine organizedProfile markdown for fields
function mineOrganizedProfile(op) {
    if (!op) return {};
    const result = {};
    const nameMatch = op.match(/\*\*Legal Name\*\*[:\s|]+([^\n|]+)/);
    if (nameMatch) {
        const parts = nameMatch[1].split('/');
        if (parts[0]?.trim()) result.nameEn = parts[0].trim();
        if (parts[1]?.trim()) result.nameKh = parts[1].trim();
    }
    const dirMatch = op.match(/\*\*(?:Director|Chairman|Managing Director|Owner|Proprietor)\*\*[:\s|]+([^\n|]+)/i);
    if (dirMatch && dirMatch[1].trim() !== '—' && dirMatch[1].trim() !== '-') {
        result.director = dirMatch[1].trim();
    }
    const regMatch = op.match(/\*\*(?:Registration Number|Company Number|Reg\.? No\.?)\*\*[:\s|]+([^\n|]+)/i);
    if (regMatch) result.reg = regMatch[1].trim();
    const addrMatch = op.match(/\*\*(?:Address|Registered Address|Office Address)\*\*[:\s|]+([^\n|]+)/i);
    if (addrMatch) result.address = addrMatch[1].trim();
    return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🔧 Silent Profile Repair — All Units\n');
    console.log('Rules: Only fills empty fields. Never overwrites existing data.\n');

    // Get unit list via admin
    const adminLogin = await req('POST', '/api/auth/login', { username: 'admin1', code: '111111' });
    const adminToken = adminLogin.token;
    const users = await req('GET', '/api/auth/users', null, adminToken);
    const units = users.filter(u => u.role === 'unit');
    console.log(`Found ${units.length} units.\n`);

    for (const unit of units) {
        const uname = unit.username;
        process.stdout.write(`  [${uname}] ...`);

        try {
            // Login as the unit itself (safer + uses unit's own token)
            const uLogin = await req('POST', '/api/auth/login', { username: uname, code: '111111' });
            if (!uLogin.token) { process.stdout.write(' ⚠️  login failed\n'); continue; }
            const uToken = uLogin.token;

            // Fetch current profile
            const p = await req('GET', '/api/company/profile', null, uToken);

            // Gather all rawText from documents
            const allText = (p.documents || [])
                .filter(d => d.rawText)
                .map(d => d.rawText)
                .join('\n\n---\n\n');

            // Mine organizedProfile too
            const opData = mineOrganizedProfile(p.organizedProfile);

            // Build update — ONLY set fields that are currently empty
            const update = {};
            let changed = false;

            // companyNameEn
            if (!p.companyNameEn) {
                const v = extractEnName(allText) || opData.nameEn;
                if (v) { update.companyNameEn = v; changed = true; }
            }

            // companyNameKh
            if (!p.companyNameKh) {
                const v = extractKhName(allText) || opData.nameKh;
                if (v) { update.companyNameKh = v; changed = true; }
            }

            // registrationNumber
            if (!p.registrationNumber) {
                const v = extractReg(allText) || opData.reg;
                if (v) { update.registrationNumber = v; changed = true; }
            }

            // director
            if (!p.director) {
                const v = extractDirector(allText) || opData.director;
                if (v) { update.director = v; changed = true; }
            }

            // address
            if (!p.address) {
                const v = extractAddress(allText) || opData.address;
                if (v) { update.address = v; changed = true; }
            }

            // contactEmail
            if (!p.contactEmail) {
                const v = extractEmail(allText);
                if (v) { update.contactEmail = v; changed = true; }
            }

            // contactPhone
            if (!p.contactPhone) {
                const v = extractPhone(allText);
                if (v) { update.contactPhone = v; changed = true; }
            }

            if (!changed) {
                process.stdout.write(` ✓ complete (${(p.documents||[]).length} docs)\n`);
                continue;
            }

            // Push update
            const upRes = await req('POST', '/api/company/update-profile', update, uToken);
            if (upRes.profile || upRes.message?.includes('synchronized')) {
                const fields = Object.keys(update).join(', ');
                process.stdout.write(` ✅ filled: [${fields}]\n`);
            } else {
                process.stdout.write(` ⚠️  update returned unexpected response\n`);
            }

        } catch (e) {
            process.stdout.write(` ❌ ${e.message}\n`);
        }
    }

    console.log('\n✅ Silent repair complete. No restarts needed.\n');
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1); });
