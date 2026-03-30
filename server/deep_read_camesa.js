/**
 * deep_read_camesa.js
 * Reads ALL documents from all available routes, extracts missing fields,
 * and patched the CAMESA profile with what's found in the 4 docs.
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

async function main() {
    // Login
    const adminLogin = await req('POST','/api/auth/login',{username:'admin1',code:'111111'});
    const adminToken = adminLogin.token;
    const camesaLogin = await req('POST','/api/auth/login',{username:'CAMESA',code:'111111'});
    const camesaToken = camesaLogin.token;
    console.log('✅ Logged in as admin1 + CAMESA\n');

    // Try both routes to maximize doc coverage
    const [profileAdmin, profileUnit] = await Promise.all([
        req('GET', '/api/company/admin/profile/CAMESA', null, adminToken),
        req('GET', '/api/company/profile', null, camesaToken)
    ]);

    // Merge documents from both responses (deduplicate by docType)
    const allDocs = new Map();
    for (const p of [profileAdmin, profileUnit]) {
        for (const doc of (p.documents || [])) {
            if (!allDocs.has(doc.docType) || (doc.rawText && !allDocs.get(doc.docType).rawText)) {
                allDocs.set(doc.docType, doc);
            }
        }
    }

    console.log(`Total unique documents found: ${allDocs.size}`);
    allDocs.forEach((doc, type) => {
        console.log(`  - ${type} | status: ${doc.status} | rawText: ${doc.rawText ? doc.rawText.length + ' chars' : 'NONE'}`);
    });

    // Concatenate ALL rawText for extraction
    const fullText = [...allDocs.values()]
        .filter(d => d.rawText)
        .map(d => `\n\n=== ${d.docType} ===\n${d.rawText}`)
        .join('\n');

    console.log(`\nTotal text for extraction: ${fullText.length} chars\n`);

    // Print ALL rawText so we can see what's there
    console.log('════════════════ FULL RAW TEXT ════════════════');
    console.log(fullText.substring(0, 8000));
    console.log('═══════════════════════════════════════════════');

    // --- Extract missing fields ---
    function find(text, ...patterns) {
        for (const p of patterns) {
            const m = text.match(p);
            if (m) {
                const v = (m[1]||m[2]||'').trim().replace(/\s+/g,' ');
                if (v.length > 1) return v;
            }
        }
        return null;
    }

    const director = find(fullText,
        /(?:Owner|Proprietor|Director|Chairman)[:\s]+([A-Z][a-zA-Z\s.]{3,})/i,
        /Name\s*\(in English\)[:\s]+([^\n\r]+)/i,
        /FullName[:\s]+([^\n\r]+)/i,
        /Contact Person[:\s]+([^\n\r]+)/i,
    );
    const directorKh = find(fullText,
        /Name\s*\(in Khmer\)[:\s\n]+([^\n\r]{3,})/i,
        /ឈ្មោះ[:\s\n]+([^\n\r]{3,})/,
    );
    const address = find(fullText,
        /(?:Physical|Office|Registered|Business|Headquarters)\s+Address[:\s]+([^\n\r]{10,})/i,
        /Address[:\s]+([^\n\r]{10,})/i,
        /ស្ថានីយ[:\s\n]+([^\n\r]{5,})/,
    );
    const business = find(fullText,
        /(?:Business\s+)?(?:Objective|Activity|Activities)[:\s]+([^\n\r]{5,})/i,
        /ISIC[:\s]+([^\n\r]{5,})/i,
    );
    const capital = find(fullText,
        /(?:Share\s+)?Capital[:\s]+([^\n\r]{3,})/i,
        /ដើមទុន[:\s]+([^\n\r]{3,})/,
    );
    const email = (fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)||[])[1];
    const phone = find(fullText,
        /(?:Tel|Phone|Mobile)[:\s]+([+\d\s()-]{7,})/i,
        /(\+855[\d\s()-]{8,})/,
    );

    console.log('\n── Extracted Fields ──');
    console.log('director     :', director || '(not found)');
    console.log('directorKh   :', directorKh || '(not found)');
    console.log('address      :', address || '(not found)');
    console.log('business     :', business || '(not found)');
    console.log('capital      :', capital || '(not found)');
    console.log('email        :', email || '(not found)');
    console.log('phone        :', phone || '(not found)');

    // Build update — only non-null values
    const update = {};
    const curr = profileUnit;
    if (!curr.director     && director)   update.director = director;
    if (!curr.address      && address)    update.address = address;
    if (!curr.businessActivity && business) update.businessActivity = business;
    if (!curr.contactEmail && email)      update.contactEmail = email;
    if (!curr.contactPhone && phone)      update.contactPhone = phone;
    if (director && directorKh) {
        update.directors = [{ nameEn: director, nameKh: directorKh || '', isChairman: true }];
    }

    if (Object.keys(update).length === 0) {
        console.log('\n⚠️  Nothing new to push — all fields already filled or not found in rawText');
        return;
    }

    console.log('\n── Pushing update ──');
    console.log(JSON.stringify(update, null, 2));

    const res = await req('POST', '/api/company/update-profile', update, camesaToken);
    if (res.profile || res.message?.includes('synchronized')) {
        console.log('\n✅ CAMESA profile updated successfully!');
    } else {
        console.log('\n⚠️  Response:', JSON.stringify(res).substring(0,200));
    }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
