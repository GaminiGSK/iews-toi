const fs = require('fs');
const path = 'e:\\Antigravity\\TOI\\server\\routes\\company.js';
let content = fs.readFileSync(path, 'utf8');

// Only replace the single line for businessActivities
const OLD = `            businessActivities: p.businessActivity || ext('businessActivity') || '',`;

const NEW = `            businessActivities: (() => {
                const actEn = p.businessActivity || ext('businessActivity') || '';
                // GDT ISIC code → Khmer description lookup
                const isicKhmer = {
                    '62010': 'ការសរសេរកម្មវិធី',
                    '62020': 'ការផ្ដល់ប្រឹក្សា IT',
                    '62090': 'សកម្មភាព IT ផ្សេងៗ',
                    '620':   'ការសរសេរកម្មវិធី ការផ្ដល់ប្រឹក្សា',
                    '63110': 'ដំណើរការទិន្នន័យ',
                    '63120': 'វេទិកា Internet',
                    '47':    'ការលក់រាយ',
                    '46':    'ការលក់ដុំ',
                    '56':    'ម្ហូបអាហារ និងភេស្សភ័ជ',
                    '41':    'សំណង់',
                    '68':    'អចលនទ្រព្យ',
                    '69':    'ច្បាប់ និងគណនេយ្យ',
                    '70':    'ការគ្រប់គ្រង',
                    '73':    'ផ្សព្វផ្សាយ',
                    '85':    'ការអប់រំ',
                    '86':    'សុខភាព',
                };
                let kh = '';
                for (const [code, khLabel] of Object.entries(isicKhmer)) {
                    if (actEn.includes(code)) { kh = khLabel; break; }
                }
                return kh ? kh + '\\n' + actEn : actEn;
            })(),`;

if (!content.includes(OLD)) {
    console.error('ERROR: Target string not found! No changes made.');
    process.exit(1);
}

const count = (content.match(new RegExp(OLD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
if (count !== 1) {
    console.error(`ERROR: Found ${count} occurrences, expected exactly 1. No changes made.`);
    process.exit(1);
}

content = content.replace(OLD, NEW);
fs.writeFileSync(path, content, 'utf8');
console.log('SUCCESS: businessActivities updated with Khmer lookup');
