require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const JournalEntry = require('./models/JournalEntry');
const AccountCode = require('./models/AccountCode');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iews_toi').then(async () => {
  const start = new Date('2025-01-01');
  const end   = new Date('2025-12-31');

  // Chart of accounts — show toiCode mapping
  const codes = await AccountCode.find({ companyCode: 'GK_SMART_AI' })
    .select('code description toiCode').lean();
  console.log('\n--- CHART OF ACCOUNTS (toiCode mapping) ---');
  codes.forEach(c => console.log(
    String(c.code).padEnd(8),
    String(c.toiCode || 'NONE').padEnd(8),
    (c.description || '').substring(0, 35)
  ));

  // Sum GL by toiCode
  const glMap = {};
  const acc = (tc, dr, cr) => {
    if (!tc) return;
    if (!glMap[tc]) glMap[tc] = { dr: 0, cr: 0 };
    glMap[tc].dr += dr || 0;
    glMap[tc].cr += cr || 0;
  };

  const txns = await Transaction.find({
    companyCode: 'GK_SMART_AI',
    date: { $gte: start, $lte: end }
  }).populate('accountCode').lean();

  txns.forEach(tx => {
    const tc = tx.accountCode?.toiCode;
    if (!tc) return;
    const a = Math.abs(tx.amount);
    tx.amount > 0 ? acc(tc, a, 0) : acc(tc, 0, a);
  });

  const jes = await JournalEntry.find({
    companyCode: 'GK_SMART_AI',
    date: { $gte: start, $lte: end }
  }).populate('lines.accountCode').lean();

  jes.forEach(je => (je.lines || []).forEach(ln => {
    const tc = ln.accountCode?.toiCode;
    acc(tc, ln.debit, ln.credit);
  }));

  console.log('\n--- GL BALANCES BY TOI CODE (2025) ---');
  Object.entries(glMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([tc, v]) => console.log(
      String(tc).padEnd(8),
      'DR:', v.dr.toFixed(2).padStart(14),
      'CR:', v.cr.toFixed(2).padStart(14)
    ));

  // Compute net P&L
  const glDr = tc => glMap[tc]?.dr || 0;
  const glCr = tc => glMap[tc]?.cr || 0;
  const glExp = tc => Math.max(glDr(tc), glCr(tc)); // picks whichever side has the expense

  const revenue = Math.max(glCr('I02') - glDr('I02'), 0) || Math.max(glDr('I02') - glCr('I02'), 0);
  const salaryGL   = glExp('B23') + glExp('B24') + glExp('B25');
  const depGL      = glExp('B27') + glExp('B36') + glExp('E30');
  const bankGL     = glExp('B29') + glExp('B41');
  const consulting = glExp('B33');
  const otherGL    = glExp('B34') + glExp('B35') + glExp('B38') + glExp('B39') + glExp('B40') + glExp('B43') + glExp('B47');
  const totalOpEx  = salaryGL + depGL + bankGL + consulting + otherGL;
  const netPbt     = revenue - totalOpEx;

  console.log('\n--- COMPUTED P&L ---');
  console.log('Revenue (I02):    ', revenue.toFixed(2));
  console.log('Salary (B23-25):  ', salaryGL.toFixed(2), salaryGL === 0 ? '← CORRECT (0, no GL salary)' : '');
  console.log('Depreciation (B27/B36/E30):', depGL.toFixed(2));
  console.log('Bank charges (B29/B41):    ', bankGL.toFixed(2));
  console.log('Business Reg (B33):        ', consulting.toFixed(2));
  console.log('Other (B34-B47):           ', otherGL.toFixed(2));
  console.log('Total Expenses:   ', totalOpEx.toFixed(2));
  console.log('NET P&L:          ', netPbt.toFixed(2), netPbt < 0 ? '← LOSS ✓' : '← PROFIT');

  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
