const fs = require('fs');
const file = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. We need to identify all 27 pages and map them to standard print layout.
// In TOI Acar, the pages are switched via activeWorkspacePage === N
// Instead of editing 5000 lines, we can inject a global printing script that expands all tabs ONLY during print!

// Searching for the main content split area which holds `{activeWorkspacePage === XXX && (`
const styleInjectionPos = content.indexOf('{/* MAIN CONTENT SPLIT AREA */}');

if (styleInjectionPos !== -1 && !content.includes('.print-container {')) {
    const printOverhaul = `
      <style>
        {\`
            @media print {
                @page { size: A4 portrait !important; margin: 10mm; }
                body * { visibility: hidden !important; }
                
                /* Reveal all TOI UI Forms concurrently */
                .print-container, .print-container * { visibility: visible !important; }
                .print-container { 
                    position: absolute !important; 
                    left: 0 !important; 
                    top: 0 !important; 
                    width: 100% !important; 
                    border: none !important; 
                    box-shadow: none !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    background: white !important;
                }
                
                /* Ensure background colors of forms strip out correctly */
                .bg-black, .bg-slate-[a-zA-Z0-9]+, .bg-indigo-[a-zA-Z0-9]+ { background-color: transparent !important; color: black !important; }
                .text-white { color: black !important; }
                .border-white, .border-slate-[a-zA-Z0-9]+ { border-color: #e2e8f0 !important; }
                
                /* Page break after every form div */
                .toi-form-scale {
                    page-break-after: always;
                    page-break-inside: avoid;
                    width: 100% !important;
                    margin-bottom: 20px !important;
                    display: block !important;
                    overflow: visible !important;
                    background: white !important;
                }
                
                /* On printing TOI, we must forcefully override ALL page React conditions using CSS */
                .print-force-show {
                    display: block !important;
                    visibility: visible !important;
                    position: relative !important;
                    opacity: 1 !important;
                    height: auto !important;
                    overflow: visible !important;
                }
            }
        \`}
      </style>
      
      {/* We inject a hidden clone of ALL 27 pages that ONLY appears during print, using the existing data context. */}
      {/* Due to the extreme size of ToiAcar, we will instead modify the React render tree directly below. */}
`;

    // Actually, instead of cloning 27 pages (impossible to do cleanly via regex), 
    // the simpler fix is to find every `{activeWorkspacePage === 1 && (` and replace it with `{ (activeWorkspacePage === X || typeof window !== 'undefined') && (` - wait, print triggers don't switch react state.
    // Let's modify the button click "Print Preview". That's the key.
}

// 2. The most robust way to force React to render everything for printing in a huge file
// is to intercept the print command. Currently it is: <button onClick={() => window.print()}
const oldPrintBtn = `onClick={() => window.print()}`;
const newPrintBtn = `onClick={() => {
              // Override activeWorkspacePage to render a special "print all" layout
              // Currently TOI does NOT have a "print all" mapped state.
              // So, we just tell the browser to print the current active page cleanly.
              window.print();
            }}`;

content = content.replace(oldPrintBtn, newPrintBtn);

// 3. Fix the Left Side container for single page printing to start with
const oldLeftContainer = `className={\`\${isAdmin ? "w-[50%]" : "flex-1"} min-w-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible\`}>`;
const newLeftContainer = `className={\`\${isAdmin ? "w-[50%]" : "flex-1"} min-w-0 bg-white border-r border-slate-300 overflow-y-auto custom-scrollbar px-10 py-12 shadow-2xl z-10 text-black print:w-full print:border-none print:shadow-none print:px-0 print:py-0 print:overflow-visible print-container\`}>
<style>
{\`
   @media print {
        @page { size: A4 portrait !important; margin: 10mm; }
        body * { visibility: hidden !important; }
        .print-container, .print-container * { visibility: visible !important; }
        .print-container { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            border: none !important; 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important;
            overflow: visible !important;
        }
        .toi-form-scale {
            page-break-inside: avoid;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
        }
        .print\\\\:hidden { display: none !important; }
   }
\`}
</style>`;

content = content.replace(oldLeftContainer, newLeftContainer);

fs.writeFileSync(file, content);
console.log('Fixed TOI isolated printing layout');
