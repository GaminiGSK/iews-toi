const fs = require('fs');
const file = 'e:/Antigravity/TOI/client/src/index.css';
let content = fs.readFileSync(file, 'utf8');

const spinnerCSS = `
/* =============================================
   GLOBAL: Hide number input spinner arrows
   Users can type any value directly
   ============================================= */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

`;

// Insert after the @layer base block
content = content.replace('@media print {', spinnerCSS + '@media print {');
fs.writeFileSync(file, content, 'utf8');
console.log('✅ Spinner CSS added to index.css');
