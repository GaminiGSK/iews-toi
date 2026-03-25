const fs = require('fs');
const content = fs.readFileSync('client/src/pages/ToiAcar.jsx', 'utf8');

// Find each page block
const pageLines = [];
const lines = content.split('\n');
lines.forEach((line, i) => {
    const m = line.match(/activeWorkspacePage === (\d+)/);
    if (m) pageLines.push({ page: parseInt(m[1]), lineNum: i + 1 });
});
pageLines.sort((a,b) => a.lineNum - b.lineNum);

// For each page, extract info about fields
const report = [];
for (let i = 0; i < pageLines.length; i++) {
    const p = pageLines[i];
    const nextLine = pageLines[i+1]?.lineNum || lines.length;
    const section = lines.slice(p.lineNum - 1, nextLine - 1).join('\n');

    // Count hardcoded dashes vs filledData reads
    const dashCount = (section.match(/>\-<\/div>/g) || []).length;
    const filledDataCount = (section.match(/filledData\??\./g) || []).length;
    const inputCount = (section.match(/<input|<textarea/g) || []).length;
    const rowKeys = [...new Set((section.match(/filledData\??\.([a-zA-Z0-9_]+)/g) || []).map(m => m.replace('filledData?.', '').replace('filledData.', '')))].join(', ');

    // Find the page title
    const titleMatch = section.match(/TOI 01 \/ ?([IVXLC0-9]+)|PAGE \d+|Page \d+/);

    report.push({
        page: p.page,
        line: p.lineNum,
        title: titleMatch?.[0] || '?',
        dashes: dashCount,
        filledDataReads: filledDataCount,
        inputs: inputCount,
        keys: rowKeys.substring(0, 100)
    });
}

report.forEach(r => {
    console.log(`\nPage ${r.page} (L${r.line}) [${r.title}]`);
    console.log(`  Hardcoded dashes: ${r.dashes} | filledData reads: ${r.filledDataReads} | inputs: ${r.inputs}`);
    if (r.keys) console.log(`  Keys: ${r.keys}`);
});
