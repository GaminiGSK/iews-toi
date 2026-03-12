const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'client/src/pages/ToiAcar.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove gray backgrounds from section 11 onwards
const splitPointStr = "{/* Compliance Details (Sections 11 - 18) */}";
const parts = content.split(splitPointStr);
if (parts.length === 2) {
    let complianceSection = parts[1];
    complianceSection = complianceSection.replace(/bg-\[#e6e6e6\]/g, 'bg-white');
    complianceSection = complianceSection.replace(/bg-\[#f0f0f0\]/g, 'bg-white');
    content = parts[0] + splitPointStr + complianceSection;
}

// 2. Reduce explicit heights to make the form physically shorter for A4 print
content = content.replace(/min-h-\[50px\]/g, 'min-h-[50px] print:min-h-0');
content = content.replace(/min-h-\[44px\]/g, 'min-h-[44px] print:min-h-0');
content = content.replace(/min-h-\[36px\]/g, 'min-h-[36px] print:min-h-0');
content = content.replace(/min-h-\[38px\]/g, 'min-h-[38px] print:min-h-0');
content = content.replace(/min-h-\[30px\]/g, 'min-h-[30px] print:min-h-0');
content = content.replace(/min-h-\[140px\]/g, 'min-h-[140px] print:min-h-[110px]');
content = content.replace(/min-h-\[64px\]/g, 'min-h-[64px] print:min-h-0');

// Reduce spacing above the title
content = content.replace(/mb-12 print:mb-4/g, 'mb-12 print:mb-2');
content = content.replace(/pt-24 print:pt-6/g, 'pt-24 print:pt-1');
content = content.replace(/mb-8 print:mb-4/g, 'mb-8 print:mb-2');
content = content.replace(/pt-10 print:pt-4/g, 'pt-10 print:pt-1');

// Reduce text paddings horizontally
content = content.replace(/px-10 py-12/g, 'px-8 py-8 print:p-0');

// Further reduce inner row paddings for print
content = content.replace(/py-1/g, 'py-1 print:py-0');
content = content.replace(/py-2/g, 'py-2 print:py-0');
content = content.replace(/py-\[6px\]/g, 'py-[6px] print:py-0');
content = content.replace(/pt-2/g, 'pt-2 print:pt-0');
content = content.replace(/mb-4/g, 'mb-4 print:mb-1');
content = content.replace(/mb-2/g, 'mb-2 print:mb-0');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('ToiAcar.jsx patched successfully');
