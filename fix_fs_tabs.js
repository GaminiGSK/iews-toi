const fs = require('fs');
let code = fs.readFileSync('client/src/pages/FinancialStatements.jsx', 'utf8');

// 1. Navigation Tabs
code = code.replace(/>\s*Income Statement\s*<\/button>/, '> របាយការណ៍លទ្ធផល / Income Statement </button>');
code = code.replace(/>\s*Balance Sheet\s*<\/button>/, '> របាយការណ៍ស្ថានភាពហិរញ្ញវត្ថុ / Balance Sheet </button>');
code = code.replace(/>\s*Cash Flow\s*<\/button>/, '> របាយការណ៍លំហូរសាច់ប្រាក់ / Cash Flow </button>');
code = code.replace(/>\s*Equity Changes\s*<\/button>/, '> បម្រែបម្រួលមូលធន / Equity Changes </button>');
code = code.replace(/>\s*Notes \(CIFRS\)\s*<\/button>/, '> កំណត់សម្គាល់ / Notes (CIFRS) </button>');

// 2. The <thead> sections in Income Statement which I tried to replace earlier but failed
code = code.replace(
    /<tr className="bg-slate-100 border-b border-gray-300">\s*<th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ \/ DESCRIPTION<\/th>\s*<th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br\/>NOTE<\/th>\s*<th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>DESCRIPTION<\/th>\s*<th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>NOTE<\/th>/g,
    `<tr className="bg-slate-100 border-b border-gray-300">
        <th className="p-3 text-left font-bold text-gray-600 uppercase text-xs" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>បរិយាយ / DESCRIPTION</th>
        <th className="p-3 text-center font-bold text-gray-600 uppercase text-xs w-20" style={{ fontFamily: '"Kantumruy Pro", sans-serif' }}>ចំណាំ<br/>NOTE</th>`
);

let count = code.match(/របាយការណ៍លទ្ធផល \/ Income Statement/) ? 1 : 0;
fs.writeFileSync('client/src/pages/FinancialStatements.jsx', code, 'utf8');
console.log(`Updated Tabs!`);
