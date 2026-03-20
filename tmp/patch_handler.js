const fs = require('fs');
const file = 'e:/Antigravity/TOI/client/src/components/AIAssistant.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// The new handler replaces lines 229-303 (1-indexed) = indices 228-302
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

            const icon = quarterComplete ? '✅' : '📄';
            const statusLine = quarterComplete
                ? 'Quarter COMPLETE! Last balance $' + lastBalance + ' matches ending $' + (expectedSummary && expectedSummary.endingBalance) + '.'
                : 'Page recorded. Last balance on this page: $' + (lastBalance != null ? lastBalance : 'N/A') + '. Drop the next page to continue.';

            const targetLine = (expectedSummary && expectedSummary.endingBalance)
                ? 'Quarter Target: In $' + expectedSummary.totalMoneyIn + ' | Out $' + expectedSummary.totalMoneyOut + ' | Ending $' + expectedSummary.endingBalance
                : '';

            const msg = icon + ' ' + quarter + ' - page read.\n\n'
                + 'Period: ' + (period || 'See cover page') + '\n'
                + 'This page: ' + thisPageTransactions + ' transaction(s)\n'
                + 'Total so far: ' + totalTransactionsSoFar + ' accumulated\n'
                + (targetLine ? targetLine + '\n' : '')
                + 'Accumulated In: $' + (accumulatedActual && accumulatedActual.totalIn) + ' | Out: $' + (accumulatedActual && accumulatedActual.totalOut) + '\n\n'
                + statusLine;

            setMessages(prev => [...prev, { role: 'assistant', text: msg, isSystem: false }]);

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

// Replace lines 229-303 (1-indexed) = splice at index 228, remove 75 lines
lines.splice(228, 75, newHandler);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Done. Total lines now:', lines.length);
