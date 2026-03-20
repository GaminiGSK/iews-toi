# Blue Agent Knowledge Base

This document provides context and guidelines for the **Blue Agent** to assist in tax form processing and workspace automation.

## 1. Domain Context: Cambodia Tax On Income (TOI)
- **Authority**: General Department of Taxation (GDT).
- **Primary Form**: TOI 01 (Annual Income Tax Return).
- **TIN Format**: 4-box-9-box (e.g., 1000-XXXXXXXXX).
- **Currency**: Khmer Riel (KHR). Official exchange rate (approx. 4000-4100 KHR/USD) must be retrieved from GDT circulars for tax calculations.

## 2. Technical Stack
- **Backend**: Node.js, Express, MongoDB.
- **Frontend**: React, Tailwind CSS.
- **AI Services**: Google Gemini (Vertex AI), Document AI.
- **Storage**: Google Drive (Cloud-based document management).

## 3. Automation Guidelines
- **Data Extraction**: Use Document AI for initial extraction, then refine with Gemini Vision for complex table structures.
- **Validation**: Compare extracted data against `filled_form_data.json` schema to ensure data integrity.
- **Real-time Updates**: Use Socket.io to push progress to the `LiveTaxWorkspace.jsx`.

## 4. Visual Standards
- **Premium UI**: Workspace must maintain high-fidelity aesthetics (Glassmorphism, rounded corners, professional typography).
- **Khmer Font**: Use `Kantumruy Pro` for all formal tax labels.

## 5. Storage / Archive
- All form scans (.jpg) should be stored in the dedicated Google Drive folder for training and reference.
- File naming convention: `[YEAR]_[FORM_TYPE]_[TIN]_[TIMESTAMP].jpg`

## 6. AI Interaction Rules
- **DO NOT** use a browser subagent to check `localhost` unless explicitly requested by the user. The user prefers to review the internal setup themselves or provide screenshots.

## 7. Command & Control Bridge (C&C)
- **Architecture**: The GK Blue Agent acts as the Internal System Auditor and operates on a live synchronization bridge hosted at the `/api/bridge/` Cloud Run endpoints.
- **Data Push (Alerts)**: Administrative scripts or triggers publish alerts containing live financial rules to the Bridge Queue (MongoDB `Bridge` collection).
- **Global Live Sync**: The Blue Agent has explicit database-level sync connectivity to query massive payloads of live Trial Balances, Ledgers, and tax templates simultaneously via the `/api/bridge/sync` `AUDIT_REQUEST` scope without needing the user's frontend.
- **Rule Enforcement**: The agent must constantly monitor the bridge for new CIFRS mapping taxonomies or "FORCE_RECONCILIATION" requests and retroactively patch its own ledger interpretations appropriately.

## 8. CRITICAL: How to Update TB and FS Forms — The GL-First Rule

**This is the master accounting rule. BA must follow this exactly when the user says "update TB", "update FS", or "fix the numbers".**

### Step 1 — Read the General Ledger (GL) — The Single Source of Truth
The GL is the ONLY source of truth. Never fabricate, infer, or use arithmetic "Control Totals" to manufacture data.

To compile the GL data for any account code:
1. Filter all transactions by `companyCode` and `accountCode` (linked to chart of accounts)
2. Include all Journal Entry lines that reference the same `accountCode`
3. Sort by `date` ascending (oldest first)
4. For each entry record: `date | description | money IN (positive) | money OUT (negative) | running balance`

### Step 2 — Compile the Trial Balance (TB1, TB2, TB3)
For each account code in the Chart of Accounts:
- **Debit (DR) column** = sum of all Money-Out transactions tagged to that code (expense/asset purchases)
- **Credit (CR) column** = sum of all Money-In transactions tagged to that code (income/equity received)
- **Journal adjustments** overlay on top: DR debit lines, CR credit lines
- TB is balanced when: Total DR = Total CR

**RULE FOR ABA (10130)**: ABA has NO transactions tagged to it directly in the GL.
- ABA balance = Net of all bank statement transactions (sum of all amounts positive and negative)
- ABA DR = net positive bank balance
- Do NOT inject fabricated "control total" into ABA row

### Step 3 — Compile Financial Statements (FS1–FS7) from GL

**FS1 — Income Statement (Annual)**
- Revenue (4xxxx codes): sum all CR amounts for that year
- Cost of Sales (5xxxx codes): sum all DR amounts
- Operating Expenses (6xxxx, 7xxxx codes): sum all DR amounts
- Net Profit = Revenue − Cost of Sales − Expenses

**FS2 — Balance Sheet (Annual)**
- Assets (1xxxx codes): cumulative DR − CR balance
- Liabilities (2xxxx codes): cumulative CR − DR balance
- Equity (3xxxx codes): cumulative CR − DR balance
- Must verify: Total Assets = Total Liabilities + Total Equity

**FS6 — Monthly Income Statement**
- Same as FS1 but broken by calendar month (Jan–Dec)
- Each column shows ONLY the activity in THAT month (not cumulative)
- Formula per month: `month_value = sum of transactions in that specific month only`

**FS7 — Monthly Balance Sheet (Statement of Financial Position)**
- Shows the ENDING BALANCE (running balance) at the close of each month
- Formula: `Jan_Balance = Opening_Balance + all Jan transactions`
- Formula: `Feb_Balance = Jan_Balance + all Feb transactions` ← CARRY FORWARD
- Formula: `Month_N_Balance = Month_(N-1)_Balance + all Month_N transactions`
- The opening balance comes from the PRIOR year-end closing balance
- Every month column MUST show the cumulative position — never reset to zero

### Step 4 — Placement Rules (Right Account in Right Section)
| Code Range | Section | TB Column | FS Location |
|------------|---------|-----------|-------------|
| 1xxxx (Assets) | ASSETS | DR increases, CR decreases | FS2 / FS7 Assets section |
| 2xxxx (Liabilities) | LIABILITIES | CR increases, DR decreases | FS2 / FS7 Liabilities section |
| 3xxxx (Equity) | EQUITY | CR increases, DR decreases | FS2 / FS7 Equity section |
| 4xxxx (Revenue/Income) | INCOME | CR increases | FS1 / FS6 Revenue |
| 5xxxx (Cost of Sales) | COST OF SALES | DR increases | FS1 / FS6 Cost of Sales |
| 6xxxx–9xxxx (Expenses) | EXPENSES | DR increases | FS1 / FS6 Operating Expenses |

### Step 5 — Final Validation Checks BA Must Run
1. TB: Total DR = Total CR ✓ (if not equal → find error, do not ignore)
2. FS2/FS7: Total Assets = Total Liabilities + Total Equity ✓
3. FS1/FS6: Net Profit from P&L = Change in Retained Earnings on Balance Sheet ✓
4. ABA balance in FS2/FS7 must match the Bank Statement (BS1) net balance ✓
5. NEVER show negative balance for ABA unless the real bank statement confirms an overdraft ✓
