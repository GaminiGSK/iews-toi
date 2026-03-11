# Incident Response & Disaster Recovery: March 2026
**System:** GKSMART TOI / ACAR Cloud Platform
**Date Prepared:** March 10, 2026
**Prepared By:** GK Blue Agent

---

## Executive Summary
Over a two-day period, the GKSMART Enterprise Work System experienced multiple critical failures cascading across essential functionalities including Tax on Income (TOI) template rendering, the General Ledger frontend, and Bank Statement persistence. These incidents temporarily halted client work capabilities.

Extensive diagnostic and recovery protocols were run directly against the live Production Database (MongoDB), Google Drive Storage infrastructure, and the Cloud Run / Firebase deployment environments.

All functionalities are now fully restored, data integrities have been stabilized, and code fortifications have been pushed to production. This document serves as the official Knowledge Pack outlining the root causes and recovery actions.

---

## Incident 1: Critical Missing of TOI Form Templates (All 27 Pages)
### Symptoms
Users logged into their active TOI/ACAR Workbenches found that all **27 pages of the original tax submission form had completely vanished**. The digital draft overlays attempted to render onto empty canvases, causing widespread confusion. 

### Root Cause Analysis
- **System Diagnosis:** The platform architecture relies on syncing raw high-fidelity tax template images (Page 01 - Page 27) directly from an authorized Google Drive directory mapped by a dedicated Service Account.
- **The Finding:** Extensive API footprint analysis revealed the templates were mysteriously removed from their designated `TOI FOAM` Google Drive folder.
- **The Discovery:** A deep recursive search across shared service arrays located the missing 27 templates buried inside an alternate folder named `Financial Statement preperation`.

### Recovery & Fortification Strategy
1. **Dynamic Master Syncing**: Created specific backend alignment scripts (`sync-toi-27-pages.js` and `restore-user-package-parity.js`) to forcefully import the misplaced templates.
2. **Strict Parity System (100% Match Rule)**: The frontend component (`ToiAcar.jsx`) was drastically refactored. Rather than relying on hardcoded page numbers, it now dynamically queries the database for exactly what the `Admin` has defined as the active Master templates. If an active user's "Package" array has fewer or mismatches against the Admin templates, it forcefully flashes an error preventing work. This guarantees real-time matching between user interface and admin master configurations.

---

## Incident 2: Permanent Data Deletion (The March 1st Wipe)
### Symptoms
The User reported the complete disappearance of massive historical chunks of Bank Reconciliations (BR), Credit Reports (CR), and associated ledger data. 

### Root Cause Analysis
- **System Diagnosis:** Database transaction timestamps and User Profile lifecycles were audited. No data prior to **March 1st, 2026** existed.
- **The Finding:** A systematic wipe had occurred. Root directories contained highly destructive script files (`DANGER_reset-db.js`, `DANGER_clear-transactions.js`). The live storage configuration had been reset. Additionally, historical BR tracking objects had been manually emptied from the Google Drive trash bins. The wipe event was total and permanent. 

### Recovery & Fortification Strategy
Data prior to March 1st was physically permanently unrecoverable. Moving forward, the following safety mechanism has been enforced:
- **Binary Cloud Persistence:** Saved Bank statements and their transactions are now marked with an `isSticked` flag and hard-linked into the user's permanent `Bank Statements` drive structure before writing to the database, creating an unbreakable link between the MongoDB schema and the cloud drive binary.

---

## Incident 3: General Ledger "White-Screen of Death"
### Symptoms
Navigating to the General Ledger caused an immediate rendering collapse of the workspace. The page entirely crashed, yielding only a blank white screen, completely locking teams out of financial tracking entirely.

### Root Cause Analysis
- **System Diagnosis:** The issue was traced to an unhandled exception triggered by the **AI Auto-Tagging engine**.
- **The Finding:** The AI Engine—working dynamically to categorize transaction descriptions—was accidentally injecting raw nested JSON arrays and nested Objects inside the `description` string properties of ledger transactions.
- **React Fatal Crash:** The React.js frontend (`GeneralLedger.jsx`) explicitly expects plain Strings when rendering the ledger table or `<option>` tags in dropdowns. Whenever it hit an AI-generated *Object* instead of a String, React threw a fatal `"Objects are not valid as a React child"` renderer exception, crashing the entire tree immediately.

### Recovery & Fortification Strategy
- **Stringification Safe-Guards**: Pushed hotfixes across the `GeneralLedger.jsx` table mappers. All incoming descriptions are wrapped in strict type-checking loops (`typeof value === 'object'`). If an object injection is detected, it is trapped and converted safely via `JSON.stringify` limiting its max length.
- **Production Build:** A stable build was generated (`vite build`) and manually deployed to Firebase Hosting, overriding the client cache and lifting the white-screen blockade.

---

## Incident 4: Bank Setup "SAVE ALL" Failure (BankFile Not Defined)
### Symptoms
Inside the V2 Bank Statements Module and Bank Setup screens, users uploading statements and successfully pushing them through AI analysis would hit a wall. When clicking **"SAVE ALL"** to finalize the upload, a red error pill reading `"Error saving: BankFile is not defined"` appeared. 

### Root Cause Analysis
- **System Diagnosis:** Found directly on the backend route container logic inside `server/routes/company.js`.
- **The Finding:** The specific endpoint `/api/company/save-transactions` used the `BankFile` MongoDB schema to update 'locked' statuses, but the file was forgotten to be `required()` at the scope of the function, causing an undefined reference crash.
- **The Delay in resolution:** While the fix was immediately applied to the local workstation, the `bridge-brain` production server running on **Google Cloud Run** had not been issued a rebuild, meaning production users simply executed old broken container logic instead of the new fix.

### Recovery & Fortification Strategy
1. Added `const BankFile = require('../models/BankFile');` locally.
2. Initialized `gcloud builds submit --config cloudbuild.yaml .` to force Google Cloud to rebuild the server backend container from the fresh local codebase.
3. Automatically rolled the new container (`bridge-brain-588941282431`) to the live environment across `asia-southeast1`. Saving bank statements was verified completely functional. 
