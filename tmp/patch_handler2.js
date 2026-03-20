const fs = require('fs');
const file = 'e:/Antigravity/TOI/client/src/components/AIAssistant.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Find the handleBankStatementDrop function start and end
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Bank Statement Drop Handler') || lines[i].includes('handleBankStatementDrop')) {
        if (startIdx === -1) startIdx = i;
    }
    // Find the closing }; after the function
    if (startIdx !== -1 && i > startIdx && lines[i].trim() === '};') {
        endIdx = i;
        break;
    }
}

console.log('Found handler: lines', startIdx + 1, 'to', endIdx + 1);

// Build the replacement with proper \n escape sequences (no literal newlines in strings)
const newHandler = `    // Bank Statement Drop Handler - uploads file to BA parse endpoint (page by page)
    const handleBankStatementDrop = async (e) => {
        e.preventDefault();
        setBankDropActive(false);
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (!file) return;

        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Please drop a PDF or image file.', isSystem: true }]);
            return;
        }

        setMessages(prev => [...prev,
            { role: 'user', text: 'Dropped: ' + file.name },
            { role: 'assistant', text: 'Reading page... extracting only the transactions visible on this page.', isSystem: true }
        ]);
        setIsThinking(true);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post('/api/chat/parse-bank-statement', formData, {
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data' }
            });

            const { quarter, period, thisPageTransactions, totalTransactionsSoFar,
                    lastBalance, quarterComplete, expectedSummary, accumulatedActual } = res.data;

            setAuditSessions(prev => {
                const filtered = prev.filter(s => s.quarter !== quarter);
                return [...filtered, { quarter, period, summary: expectedSummary }];
            });

            const icon = quarterComplete ? '\\u2705' : '\\ud83d\\udcc4';
            const statusLine = quarterComplete
                ? 'Quarter COMPLETE! Last balance $' + lastBalance + ' matches ending $' + (expectedSummary && expectedSummary.endingBalance) + '.'
                : 'Page recorded. Last balance on this page: $' + (lastBalance != null ? lastBalance : 'N/A') + '. Drop the next page to continue.';

            const targetLine = (expectedSummary && expectedSummary.endingBalance)
                ? 'Quarter Target: In $' + expectedSummary.totalMoneyIn + ' | Out $' + expectedSummary.totalMoneyOut + ' | Ending $' + expectedSummary.endingBalance
                : '';

            const msgParts = [
                icon + ' ' + (quarter || '') + ' - page read.',
                'Period: ' + (period || 'See cover page'),
                'This page: ' + thisPageTransactions + ' transaction(s)',
                'Total so far: ' + totalTransactionsSoFar + ' accumulated',
                targetLine || null,
                'Accumulated In: $' + (accumulatedActual && accumulatedActual.totalIn) + ' | Out: $' + (accumulatedActual && accumulatedActual.totalOut),
                '',
                statusLine
            ].filter(p => p !== null).join('\\n');

            setMessages(prev => [...prev, { role: 'assistant', text: msgParts, isSystem: false }]);

        } catch (err) {
            console.error('Bank statement upload error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: 'Failed to read page: ' + ((err.response && err.response.data && err.response.data.error) || err.message),
                isSystem: true
            }]);
        } finally {
            setIsThinking(false);
        }
    };`;

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find handler boundaries. Start:', startIdx, 'End:', endIdx);
    process.exit(1);
}

lines.splice(startIdx, endIdx - startIdx + 1, newHandler);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Patched handler. New total lines:', lines.length);
