// Smart comprehensive fix for ALL pages 8-21
// Uses regex to find .map((row...) blocks and replace dash cells within them
// Also handles special standalone cells

const fs = require('fs');
const clientPath = 'client/src/pages/ToiAcar.jsx';
let content = fs.readFileSync(clientPath, 'utf8');

let totalReplaced = 0;

// ─── APPROACH: Replace ">.map((row" blocks ──────────────────────────────────
// Find each .map block and replace ">-</div>" inside it with ref-based reads
// The unique cell classnames we found:
// 1. flex-1 ...font-mono text-[10px] bg-white">-</div>  → single amount col
// 2. w-[11%] ...font-mono text-[10px]">-</div>          → N-1 col (some pages)
// 3. w-[20%] ...font-mono text-[10px]">-</div>          → N col (asset pages)
// 4. w-[11.6%] ...">-</div>                             → N-1 col (some pages)
// 5. flex-1 flex items-center justify-center py-1">-</div> → special

// Map all .map((row, ...) => blocks and do substitutions within them
// Strategy: regex over each map block - replace ">-</div>" cells

// Pattern: from ".map((row" to the closing ")}" 
// Not nested (row maps don't contain other maps)

const mapBlockRx = /\.map\(\(row[^)]*\)\s*=>\s*\(/g;
let match;
let blockCount = 0;
let newContent = content;

// Build list of all .map block start/end positions
const mapBlocks = [];
let m;
while ((m = mapBlockRx.exec(content)) !== null) {
    const start = m.index;
    // find matching closing using paren counting
    let depth = 0;
    let i = start + m[0].length - 1; // at the opening "("
    for (; i < content.length; i++) {
        if (content[i] === '(') depth++;
        else if (content[i] === ')') {
            depth--;
            if (depth <= 0) break;
        }
    }
    // i is now at the last ")" of the map call
    mapBlocks.push({ start, end: i + 2 }); // +2 for the "}" of .map
}
console.log('Total .map blocks found:', mapBlocks.length);

// For each map block, replace dash cells
// We want to track which map blocks are "row-based" (have row.ref)
let charsOffset = 0;
let ops = []; // collect {from, to, replacement} operations

for (const block of mapBlocks) {
    const blockText = content.substring(block.start, block.end);
    
    // Only process row-based maps (that use row.ref for rendering)
    if (!blockText.includes('row.ref') && !blockText.includes("{row.ref}")) continue;
    
    // Now replace all ">-</div>" within this block
    let localText = blockText;
    
    // Pattern for single-amount column cells (flex-1, bg-white or no bg)
    localText = localText.replace(
        /(\bflex-1[^"]*font-mono[^"]*">)-<\/div>/g,
        '$1{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>'
    );
    
    // Pattern for N column 21% wide cells
    localText = localText.replace(
        /(w-\[21%\][^"]*font-mono[^"]*">)-<\/div>/g,
        '$1{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>'
    );
    
    // Pattern for N column 20% wide cells
    localText = localText.replace(
        /(w-\[20%\][^"]*font-mono[^"]*">)-<\/div>/g,
        '$1{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>'
    );
    
    // Pattern for N-1 column 11% wide cells  
    localText = localText.replace(
        /(w-\[11%\][^"]*font-mono[^"]*">)-<\/div>/g,
        '$1{filledData?.[row.ref.replace(\' \',\'\')+\'_n1\'] || \'-\'}</div>'
    );
    
    // Pattern for N-1 column 11.6% wide cells
    localText = localText.replace(
        /(w-\[11\.6%\][^"]*font-mono[^"]*">)-<\/div>/g,
        '$1{filledData?.[row.ref.replace(\' \',\'\')+\'_n1\'] || \'-\'}</div>'
    );
    
    // Pattern for flex-1 justify-center (center-aligned amounts in some pages)
    localText = localText.replace(
        /(flex-1 flex items-center justify-center[^"]*">)-<\/div>/g,
        '$1{filledData?.[row.ref.replace(\' \',\'\')+\'_n\'] || \'-\'}</div>'
    );
    
    if (localText !== blockText) {
        const dashesFixed = (blockText.match(/">-<\/div>/g) || []).length - (localText.match(/">-<\/div>/g) || []).length;
        totalReplaced += dashesFixed;
        blockCount++;
        ops.push({ from: block.start, to: block.end, replacement: localText });
    }
}

// Apply operations in reverse order to preserve offsets
ops.reverse();
for (const op of ops) {
    newContent = newContent.substring(0, op.from) + op.replacement + newContent.substring(op.to);
}
content = newContent;

console.log('Map blocks modified:', blockCount);
console.log('Total dash cells replaced:', totalReplaced);

// Final tally per page
const pageNums = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
pageNums.forEach((pg, i) => {
    const idx = content.indexOf(`activeWorkspacePage === ${pg} &&`);
    if (idx < 0) return;
    const nextPg = pageNums[i+1];
    const nextIdx = nextPg ? content.indexOf(`activeWorkspacePage === ${nextPg} &&`) : content.length;
    const sec = content.substring(idx, nextIdx);
    const left = (sec.match(/">-<\/div>/g) || []).length;
    if (left > 0) console.log(`  Page ${pg}: ${left} dashes still remaining`);
    else console.log(`  Page ${pg}: ✅ CLEAN`);
});

fs.writeFileSync(clientPath, content, 'utf8');
console.log('\nSaved!');
