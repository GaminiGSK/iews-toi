# Handover Notes (Updated: Jan 2026)

## Recently Completed Work

### 1. **Real-Time "Neural Link" (Socket.io)**
- **Server**: Initialized `socket.io` in `server.js` (listening on port 5000/5001).
- **Client**: Added `SocketContext.jsx` and wrapped `App` to provide global socket access.
- **UI**: Updated `AIAssistant` to display "Online/Offline" status and listen for `agent:message`.
- **Goal**: Enables real-time updates without page refresh (e.g., when Agent finishes a task).

### 2. **Bank Statement System Stability**
- **Orphan Healing**: fix logic for transactions missing `driveId`. Created `server/scripts/heal-files.js`.
- **Exchange Rates**:
    - Fixed **Trial Balance** & **General Ledger** to fallback to `4000 KHR` if a year's exchange rate is missing (preventing invisible data).
    - Fixed issues where 2024 transactions were hidden due to Zero Rate.
- **Drive Integration**: Verified and fixed deletion/access logic.

### 3. **Document Handling Refactor**
- **Business Registration**: Refactored logic to better handle image extraction and storage (aligned with Bank Statement workflow).

---

### 1. **"Living Form" Engine (Beta)**
- [x] **Living Tax Form (Beta)**:
    - Dedicated workspace at `/tax-live`.
    - Real-time bi-directional communication with AI Agent (`TaxAgent.js`).
    - **Visual Replica Engine**: `DynamicForm.jsx` upgraded to support "Government Official" layout (White Paper Mode).
    - **High-Fidelity Header**: Implemented exact replica of TOI 01 header including GDT Seal and correct box positioning.
    - **Bilingual Support**: Full schema support for Khmer and English labels.
    - **Agent Simulation**: "Auto-Fill" feature demonstrates dynamic data population into the official structure.

- [x] **Context-Aware AI Assistant**:
    - `AIAssistant.jsx` now tracks user navigation (Route-Awareness).
    - `AnalystAgent` (Backend) updated to recognize `/tax-live` context.
    - Agent can now "see" the active form and offer specific assistance.
    - **Split View Layout**: Workspace shifted left to accommodate the Chat Window side-by-side with the form.
    - **IEWS Management**: New Dashboard Tab for managing Year-Based TOI Packages (e.g. 2025). Creates empty document sets for the Agent to fill.
    - **Real-Time Filling**: Agent pushes data to the form live.
    - **Self-Healing**: Agent detects "Export Sales" and *changes the form structure* (Schema) on the fly to add new tax sections.

### 2. **Real-Time "Neural Link" (Socket.io)**
- **Server**: Initialized `socket.io` in `server.js` (listening on port 5000/5001).
- **Client**: Added `SocketContext.jsx` and wrapped `App` to provide global socket access.
- **UI**: Updated `AIAssistant` to display "Online/Offline" status.

### 3. **Bank Statement System Stability**
- **Orphan Healing**: Fixed transaction linking.
- **Exchange Rates**: Safely falling back to 4000 KHR.

---

## Immediate Next Steps

### 1. **Connect Real Data to Tax Agent**
- **Goal**: Replace the "Mock Data" in `TaxAgent.js` with real MongoDB queries (`Transaction.find()`).
- **Action**: Implement the logic to sum turnover by Class 70 vs 41 accounts.

### 2. **Finalize Tax Logic**
- **Goal**: Implement the full rules for "Prepayment of Profit Tax" (PPT).
- **Action**: Ensure "Adjustments" are calculated correctly.

## Technical Details
- **Socket URL**: Defaults to `localhost:5000` in Dev. Ensure `VITE_API_URL` is set for Prod.
- **Exchange Rates**: Currently hardcoded fallback (4000) exists, but User should add 2024 rates in UI.
