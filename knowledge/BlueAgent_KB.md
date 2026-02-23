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
