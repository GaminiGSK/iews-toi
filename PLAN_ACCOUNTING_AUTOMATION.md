# Plan: Advanced Accounting Automation (Cash to Accrual)

**Objective:** Upgrade the "Blue Chat Agent" and the GL System to handle the "Accounting Cycle" from Unadjusted Trial Balance to Adjusted Trial Balance, incorporating non-cash entries like Depreciation and Accruals.

## 1. System Architecture Enhancements

To support "Adjusting Entries", we need to move beyond simple Bank Transactions.

### A. New Data Models
1.  **`JournalEntry`**: A general-purpose ledger entry that is NOT linked to a bank file.
    *   Fields: `date`, `description`, `reference`, `status` (Draft/Posted).
    *   `lines`: Array of `{ accountCode, debit, credit, description }`.
    *   *Purpose*: This allows the AI (or user) to insert Depreciation, Accruals, Prepayments, and Corrections without needing a bank transaction.

2.  **`FixedAsset`**: A register of company assets.
    *   Fields: `name`, `purchaseDate`, `cost`, `usefulLifeYears`, `accumulatedDepreciationAccount`, `expenseAccount`.
    *   *Purpose*: The AI reads this to calculate "Depreciation Expense" automatically at year-end.

### B. Updated Reporting Engine (Trial Balance 2.0)
*   The Trial Balance report must now sum:
    *   **Source 1**: Bank Transactions (Cash Basis).
    *   **Source 2**: Posted Journal Entries (Adjustments).
*   **Verification**: The system will automatically run `Total Dr == Total Cr` checks on the combined dataset.

---

## 2. The "Blue Chat Agent" Workflow

### Phase 1: Unadjusted Trial Balance (The "Check" Phase)
*   **Trigger**: User uploads bank statement & tags transactions.
*   **Agent Action**:
    1.  Compiles the "Unadjusted Trial Balance".
    2.  Verifies the "Implicit Bank Control" matches the statement ending balance.
    3.  Checks for any `Suspense` or `Uncategorized` accounts.
    4.  **Output**: "Your Unadjusted Books are Balanced. Net Cash Position: $X. Ready for Adjustments."

### Phase 2: Detecting Fixed Assets (Continuous)
*   **Trigger**: User tags a transaction to a "Fixed Asset" code (e.g., `17290 Cost of Automobile`).
*   **Agent Logic**: "I see you spent $20,000 on an Automobile. Is this a new asset we need to depreciate?"
*   **Action**: If yes, Agent creates a `FixedAsset` record automatically.

### Phase 3: Year-End Adjusting Entries (Step 5)
The Agent will guide the user through the "Closing" process.

#### A. Depreciation
*   **User**: "Prepare depreciation for 2024."
*   **Agent**: 
    1.  Reads `FixedAsset` register.
    2.  Calculates depreciation (e.g., Straight Line).
    3.  **Proposes Entry**: 
        *   Dr `Depreciation Expense` (6xxxx)
        *   Cr `Accumulated Depreciation` (1xxxx)
    4.  **Action**: User clicks "Post".

#### B. Accruals & Prepayments
*   **Agent Prompt**: "Do you have any significant bills received in December that haven't been paid yet? (Accrued Expenses)"
*   **User**: "Yes, $500 for Legal Fees."
*   **Agent Proposes Entry**:
    *   Dr `Legal Fees` (Expense) $500
    *   Cr `Accrued Liabilities` (Liability) $500
*   *Note*: This moves the books from Cash Basis to Accrual Basis.

---

## 3. Implementation Roadmap

### Step 1: Manual Journal Entry (MJE) Feature
*   **Backend**: Create `JournalEntry` model and APIs.
*   **Frontend**: Create a "Manual Journal" form in General Ledger.
*   **Report**: Update Trial Balance to include MJEs.

### Step 2: Fixed Asset Register
*   **Backend**: Create `FixedAsset` model.
*   **Frontend**: "Assets" Tab to view/edit assets.
*   **Integration**: Auto-detect Asset purchases from Bank Feed.

### Step 3: AI Automation
*   **Skill**: Teach the AI (Blue Agent) to:
    *   Query the Fixed Asset list.
    *   Calculate math for depreciation.
    *   Construct the JSON for a Journal Entry.
    *   Present it to the User for confirmation.

## Summary Goal
The system will evolve from a "Cash Recorder" to a "Full Accounting System". 
**Unadjusted TB** (Bank Data) + **Adjusting Entries** (AI Generated) = **Adjusted Financial Statements**.
