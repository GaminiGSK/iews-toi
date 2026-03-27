const fs = require('fs');
let content = fs.readFileSync('e:/Antigravity/TOI/server/routes/company.js', 'utf8');

const target1 = '// Source 2';
const target1End = '// Normalise percentages to sum to 100';

const target1Idx = content.indexOf(target1);
const target1EndIdx = content.indexOf(target1End);

if (target1Idx > -1 && target1EndIdx > target1Idx) {
    const replacement1 = `// Source 2 — CompanyProfile shareholders/directors (Split by comma)
                const rawNames = p.shareholder || p.director || '';
                if (rawNames) {
                    const names = rawNames.split(',').map(n => n.trim()).filter(Boolean);
                    if (names.length > 0) {
                        const pctShare = 100 / names.length;
                        const amtShareStart = Math.round(totalEquityStart / names.length);
                        const amtShareEnd = Math.round(totalEquityEnd / names.length);
                        
                        for (const personName of names) {
                            const key = personName.toLowerCase();
                            if (seen.has(key)) continue;
                            seen.add(key);
                            list.push({
                                name:        personName,
                                address:     addrKh || '',
                                nationality: 'Cambodian',
                                position:    'Shareholder / Director',
                                pctStart:    pctShare,
                                amtStart:    amtShareStart,
                                pctEnd:      pctShare,
                                amtEnd:      amtShareEnd,
                            });
                        }
                    }
                }

                // Source 3 — Salary shareholder-employees not already in list (Fallback)
                for (const emp of shEmps) {
                    if (!emp.position) continue;
                    const personName = emp.position;
                    const key = personName.trim().toLowerCase();
                    if (seen.has(key)) continue;
                    seen.add(key);
                    list.push({
                        name:        personName.trim(),
                        address:     addrKh || '',
                        nationality: 'Cambodian',
                        position:    emp.position.trim(),
                        pctStart:    100 / Math.max(shEmps.length, 1),
                        amtStart:    Math.round(totalEquityStart / Math.max(shEmps.length, 1)),
                        pctEnd:      100 / Math.max(shEmps.length, 1),
                        amtEnd:      Math.round(totalEquityEnd   / Math.max(shEmps.length, 1)),
                    });
                }

                `;

    content = content.substring(0, target1Idx) + replacement1 + content.substring(target1EndIdx);
    
    // Now replace block 2
    const target2 = `for (const emp of shEmps) {
                    if (!emp.position) continue;
                    const personName = p.director || p.shareholder || emp.position;`;
    
    const target2End = `if (totalPct > 0 && totalPct !== 100) list.forEach(x => { x.pct = Math.round(x.pct / totalPct * 10000) / 100; });`;

    const target2Idx = content.indexOf(target2);
    const target2EndIdx = content.indexOf(target2End);

    if (target2Idx > -1 && target2EndIdx > target2Idx) {
        const replacement2 = `const rawNames2 = p.shareholder || p.director || '';
                if (rawNames2) {
                    const names = rawNames2.split(',').map(n => n.trim()).filter(Boolean);
                    if (names.length > 0) {
                        for (const personName of names) {
                            const key = personName.toLowerCase();
                            if (seen.has(key)) continue;
                            seen.add(key);
                            list.push({ name: personName, address: addrKh || '', position: 'Shareholder / Director', pct: 100 / names.length });
                        }
                    }
                }

                for (const emp of shEmps) {
                    if (!emp.position) continue;
                    const personName = emp.position;
                    const key = personName.trim().toLowerCase();
                    if (seen.has(key)) continue;
                    seen.add(key);
                    list.push({ name: personName.trim(), address: addrKh || '', position: emp.position.trim(), pct: 100 / Math.max(shEmps.length, 1) });
                }
                
                // Normalise pct to 100
                const totalPct = list.reduce((s, x) => s + x.pct, 0);
                `;

        content = content.substring(0, target2Idx) + replacement2 + content.substring(target2EndIdx);
        
        fs.writeFileSync('e:/Antigravity/TOI/server/routes/company.js', content, 'utf8');
        console.log('Successfully completed array rewrite!');
    } else {
        console.log('Failed finding block 2.');
    }
} else {
    console.log('Failed finding block 1.');
}
