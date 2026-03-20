require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// The backup of original code strings before fix_tx_codes.js ran
// We need to restore the original code strings from a backup or re-derive them
// The issue: fix_tx_codes.js incorrectly overwrote correct code strings based on broken ObjectId mapping

// PROBLEM: The accountCode ObjectId column in transactions is broken/stale - only 2 valid IDs
// SOLUTION: The code STRING is correct (user set it via dropdown). We CANNOT trust ObjectId.
// We need to RESTORE the original code strings.

// Unfortunately we don't have a backup of the original code strings.
// But we DO have the check_objectid_map.js output showing BOTH fields before the fix:
// ObjectId 69accc78 (=30100) -> had transactions with code: 10110, 17230, 61070 (deposits & rent)
// ObjectId 6970edb2 (=17270) -> had transactions with code: 17230, 17250, 17290, 30100, 40000, 61041, 61051, 61220, 61241 (all expenses)

// The REAL situation: the code string was CORRECT (user manually tagged each via BS1 dropdown)
// The ObjectId was a stale pointer that doesn't reflect real categories

// Since GL module uses accountCode ObjectId to filter, and shows the RIGHT transactions under 30100,
// the UI ObjectId pointer IS correct for FILTERING purposes, but the code strings are the TRUE tags.

// BEST ACTION: Re-run rebuild_gl_tb_v3.js which uses code strings (correct)
// AND update the accountCode ObjectIds to actually match the code strings

async function run() {
    const db = mongoose.connection.db;
    
    // First restore code strings by reversing the damage from fix_tx_codes.js
    // The code strings were:
    // - 30 deposits (income): had code "10110" (some also "17230", "61070") → changed to "30100"  
    // - 73 expenses: had correct codes → changed to "17270"
    // We can't restore without a backup, BUT we know the correct data from check_code_totals.js output
    
    // The GRAND TOTALS from before fix_tx_codes.js ran:
    // 10110: 30 tx, In=$78080.07 - these are DEPOSITS
    // 17230: 1 tx, In=$0.01 - FURNITURE deposit
    // 17230: 1 tx, Out=$305 - FURNITURE purchase  
    // 17250: 16 tx, Out=$27455 - COMPUTER purchases
    // 17290: 9 tx, Out=$20810 - AUTOMOBILE purchases
    // 30100: 4 tx, Out=$2540 - capital withdrawals
    // 40000: 1 tx, Out=$305 - foreign service income
    // 61041: 11 tx, Out=$1018.67 - office supplies
    // 61051: 1 tx, Out=$305 - meals
    // 61070: 2 tx, In=$315 - rental income
    // 61220: 11 tx, Out=$195.02 - bank charges
    // 61241: 16 tx, Out=$25110 - business registration
    
    // The code strings WERE CORRECT. The real difference with GL is:
    // GL module filters by accountCode ObjectId (which points to 30100 = 69accc78 for those 30 deposits)
    // So GL shows $73,444 under "30100 filter" because those deposits' ObjectId = 30100's Id
    
    // CONCLUSION: The GL module uses accountCode ObjectId, the code strings are for our scripts
    // The CORRECT approach: rebuild TB using accountCode ObjectId (for GL module compatibility)
    // but map ObjectId to the REAL code string using the inverse of what we know

    // WHAT WE KNOW from the pre-fix data:
    // objectId 69accc78 → code "30100" for deposits (TRUE)  
    // objectId 6970edb2 → NOT "17270" - it's a garbage stale ID for all expenses
    
    // For expenses: the code STRING is correct, and we need to fix their ObjectIds
    // to point to the RIGHT account code documents
    
    const accountCodes = await db.collection('accountcodes').find({ companyCode: 'GK_SMART_AI' }).toArray();
    const codeToId = {};
    const codeDesc = {};
    accountCodes.forEach(ac => {
        codeToId[ac.code] = ac._id;
        codeDesc[ac.code] = ac.description;
    });
    
    console.log('Account codes available:', Object.keys(codeToId).sort().join(', '));
    
    // The current state after fix_tx_codes.js: everything is either 17270 or 30100
    // We need to:
    // 1. For the 30 deposits (now code=30100) - these are CORRECT (GINASINGHA capital injections)
    // 2. For the 70+ expenses (now code=17270) - we need to RESTORE their original code strings
    
    // We know expenses from the pre-fix totals:
    // 17250 (COMPUTER): 16 tx, Out=$27455
    // 17290 (AUTOMOBILE): 9 tx, Out=$20810  
    // 61041 (Office Supply): 11 tx, Out=$1018.67
    // 61220 (Bank Charge): 11 tx, Out=$195.02
    // 61241 (Business Register): 16 tx, Out=$25110
    // 17230 (Furniture): 1 tx, Out=$305
    // 30100 withdrawals: 4 tx, Out=$2540
    // 61051 (Meals): 1 tx, Out=$305
    // 40000: 1 tx, Out=$305
    
    // BUT we've already overwritten the code strings with 17270. We no longer know which expense is which.
    // The ONLY way to fix is to rebuild from the original data source.
    
    // HOWEVER: The code=30100 (income) portion is now correct.
    // For the expenses, since we don't have the original mapping, we need to:
    // Use the description field to re-tag using the classification rules or auto-tag logic
    
    console.log('\nThe code strings have been corrupted for expense transactions.');
    console.log('We need to use description-based re-tagging to restore them.');
    console.log('Fetching all code=17270 transactions (these were the original expenses)...');
    
    const expensesTx = await db.collection('transactions').find({ 
        companyCode: 'GK_SMART_AI', code: '17270' 
    }).toArray();
    
    console.log(`Found ${expensesTx.length} expense transactions needing re-tagging`);
    expensesTx.forEach(t => {
        console.log(`  ${new Date(t.date).toISOString().substring(0,10)} | out: $${t.moneyOut} | ${t.description?.substring(0,80)}`);
    });
    
    await mongoose.disconnect();
}

mongoose.connect(process.env.MONGODB_URI).then(run).catch(e => console.error(e.message));
