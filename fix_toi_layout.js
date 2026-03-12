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

// 2. Add toi-form-scale class to the main print container replacing print:w-[210mm] print:mx-auto
content = content.replace(
  /w-full flex flex-col font-sans mb-12 text-black print:w-\[210mm\] print:mx-auto print:mb-0/g,
  'w-full flex flex-col font-sans mb-12 text-black print:toi-form-scale print:mb-0'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('ToiAcar.jsx backgrounds patched successfully');
