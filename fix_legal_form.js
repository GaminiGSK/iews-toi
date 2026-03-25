const fs = require('fs');
let c = fs.readFileSync('server/routes/company.js', 'utf8');

// Find and replace the hardcoded legalForm line
const OLD = "            legalForm:         'Private Limited Company',";

const NEW = `            // ── Row 14: Legal Form — derived from BR documents (BA Auditor rule) ─────
            // Rule: Co.,Ltd/Co., Ltd/Limited Company → Private Limited Company
            //       No suffix (e.g. "GK SMART") → Sole Proprietorship / Physical Person
            // Confirmed by BR: GK SMART = Sole Proprietorship (MOC Cert + Patent Tax 2025)
            legalForm: (() => {
                const nameEn = (p.companyNameEn || '').toUpperCase();
                if (/CO\\.\\s*,?\\s*LTD|LIMITED COMPANY|PTE\\.?\\s*LTD|CORPORATION|CORP\\./i.test(nameEn)) return 'Private Limited Company';
                if (/SINGLE MEMBER/i.test(nameEn)) return 'Single Member Private Limited Company';
                if (/PUBLIC LIMITED/i.test(nameEn)) return 'Public Limited Company';
                if (/GENERAL PARTNERSHIP/i.test(nameEn)) return 'General Partnership';
                if (/LIMITED PARTNERSHIP/i.test(nameEn)) return 'Limited Partnership';
                return 'Sole Proprietorship / Physical Person';  // Default: no Co.,Ltd suffix
            })(),`;

const idx = c.indexOf(OLD);
if (idx < 0) { console.log('❌ Target not found'); process.exit(1); }

c = c.substring(0, idx) + NEW + c.substring(idx + OLD.length);
fs.writeFileSync('server/routes/company.js', c, 'utf8');
console.log('✅ Fixed legalForm at index', idx, '| File size:', c.length);
