---
description: GDT e-Tax Portal Login & TOI Filing — Full Agent Execution Routine
---

# GDT Live Filing Workflow
## For: BA TOI Agent (or any agent taking over this task)

This workflow applies to **ALL companies and users** on the GK SMART platform.
Each company stores its own GDT credentials independently in their `CompanyProfile` record.
The user does NOT need to type anything except the OTP code from their email.

---

## PRE-REQUISITES (Check before starting)

### Who is filing?
- Identify the **currently logged-in user** from the GK SMART session (JWT token → `req.user.companyCode`)
- Each company has its own GDT credentials stored in MongoDB

### Get GDT Credentials for any company

**Via API** (preferred — use the logged-in user's token):
```
GET /api/company/gdt-credentials
Authorization: Bearer <token>
```
Returns: `{ gdtUsername, gdtPassword }`

**Via DB direct query** (for agent use, from `e:\Antigravity\TOI\server`):
```javascript
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0').then(async () => {
  const CompanyProfile = require('./models/CompanyProfile');
  // Replace COMPANY_CODE with the target company e.g. 'GK_SMART_AI', 'ARAKAN', etc.
  const p = await CompanyProfile.findOne({ companyCode: 'COMPANY_CODE' }).select('gdtUsername gdtPassword companyCode companyNameEn');
  console.log('Company:', p.companyCode, '|', p.companyNameEn);
  console.log('GDT User:', p.gdtUsername);
  console.log('GDT Pass:', p.gdtPassword);
  process.exit(0);
});
"
```

**List all companies with GDT credentials saved:**
```javascript
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0').then(async () => {
  const CompanyProfile = require('./models/CompanyProfile');
  const all = await CompanyProfile.find({ gdtUsername: { \$exists: true, \$ne: '' } }).select('companyCode companyNameEn gdtUsername').lean();
  all.forEach(p => console.log(p.companyCode, '|', p.companyNameEn, '|', p.gdtUsername));
  process.exit(0);
});
"
```

---

## STEP 1 — Open the GDT Login Page

**Action**: Open `https://owp.tax.gov.kh/gdtowpcoreweb/login` in a browser tab.
Wait 8 seconds for the page to fully load.

> The page shows 3 tabs: **MOI ID | Email | TID**

---

## STEP 2 — Select the Email Tab & Fill Credentials

**CRITICAL**: Use the **Email tab** (middle tab). NOT the TID tab.

1. Click the **Email** tab
2. Click the Email input field
3. Clear any existing content (Ctrl+A → Delete)
4. Type: `gamini@ggmt.sg`
5. Click the Password field
6. Type the password (read from DB — `gdtPassword` field of `GK_SMART_AI` profile)
7. Click the **Login** button (blue button)

> ⚠️ If you use the TID tab: it will fail — `gamini@ggmt.sg` is an email, not a TIN.

---

## STEP 3 — Handle the OTP

After clicking Login, GDT redirects to:
`https://owp.tax.gov.kh/gdtowpcoreweb/verify-code`

**GDT emails a 6-digit OTP to `gamini@ggmt.sg`.**
- OTP expires in ~3 minutes
- Ask the user: *"Please check your email gamini@ggmt.sg and tell me the 6-digit code."*
- Once user provides code → type it into the 6 boxes on the verify-code page
- Click **Verify** / **Submit**

---

## STEP 4 — Arrive at GDT Application Dashboard

After OTP, browser lands at:
`https://owp.tax.gov.kh/gdtowpcoreweb/coremgm/application`

This is the GDT main portal showing all available tax modules.

---

## STEP 5 — Navigate to TOI E-Filing

On the GDT Application page:
1. Find the **"Tax on Income - ToI E-Filing"** module card
2. Click on it
3. The TOI system opens in a new page/tab at: `https://toi.tax.gov.kh/gdttoiweb/`

> GK SMART's company profile will be listed on the TOI dashboard.

---

## STEP 6 — TOI Dashboard: Find the Company

**URL**: `https://toi.tax.gov.kh/gdttoiweb/`

You will see a list of companies. Find the target company (e.g. **GK SMART**).

1. Locate the company row
2. Click the **⋮ (three dots)** action button on that row
3. A dropdown appears — click **"Detail Information"**

> ✅ Confirmed live: GK SMART is at URL pattern `toi.tax.gov.kh/gdttoiweb/{id}`
> ✅ GK SMART TIN: **K009-902103452**, Bank: Advance Bank of Asia

---

## ═══ STEP 7 — Declaration History: Find the Target Year ═══
### 🔩 CARVED IN IRON — FOLLOW EXACTLY

**You are now on the Declaration History page.**
Example URL: `https://toi.tax.gov.kh/gdttoiweb/6201c01a/02fb9ed1`

The table shows all TOI declarations by year:

| # | Tax Year | Status | Request Status | Action |
|---|---|---|---|---|
| 1 | **2025** | **Not Paid** | **Not yet submitted** | ⋮ |
| 2 | 2024 | Paid | Submitted | ⋮ |
| 3 | 2023 | Paid | Submitted | ⋮ |

**To file for Tax Year 2025 (current outstanding):**
1. Find row **Tax Year 2025** — Status: **Not Paid**, Request Status: **Not yet submitted**
2. Click the **⋮** button on that row
3. A dropdown appears with **"View Detail"** and "Disable"
4. Click **"View Detail"**

> ⚠️ Do NOT click "Disable" — that disables the declaration permanently.
> ✅ Barcode for 2025: **OTOI2026032427869** — Created 24 March 2026

---

## ═══ STEP 8 — Declaration List: Open Data Entry ═══
### 🔩 CARVED IN IRON — FOLLOW EXACTLY

**You are now on the Declaration List page.**
Example URL: `https://toi.tax.gov.kh/gdttoiweb/6201c01a/64ed586d`

This page shows:
- Company info (TIN, Name, Address, Bank)
- Attachments required: **Balance Sheet** / **Income Statement** / **Other Documents** (all currently "Not Attached")
- A **Headquarter** table with the 2025 declaration row
- A **Branches** section (currently empty — no branches)

**To enter the TOI form:**
1. In the **Headquarter** table, find the 2025 row (Barcode: OTOI2026032427869, Status: Not Paid)
2. Click the **⋮** button on that Headquarter row
3. A dropdown appears with **"Data Entry"**
4. Click **"Data Entry"**

> ✅ This opens the actual 21-page TOI declaration form
> ✅ This is where all financial data gets entered (134 fields)

---

## STEP 9 — Fill the TOI Form (21 Pages)

Once inside **Data Entry**, the TOI form has multiple pages/sections.
The agent should fill in data pulled from the GK SMART financial system:
- Revenue, Expenses, Assets, Liabilities, Equity figures
- These come from the GK SMART General Ledger / Trial Balance / Financial Statements

> **Previous session note**: The form was previously navigated through all 21 pages and reached the final Submit step. If a draft exists, verify data before submitting.

---

## KNOWN ISSUES & NOTES

| Issue | Resolution |
|---|---|
| TID tab fails for email accounts | Always use **Email tab** |
| OTP expires in ~3 min | Ask user immediately after Login is clicked |
| Sessions are not persisted in DB | Each BA session needs a fresh login |
| Server-side Puppeteer fails on GDT | GDT blocks headless bots — use real browser subagent only |
| Password not visible in UI | Read from MongoDB `gdtPassword` field directly |
| "Disable" in ⋮ menu | NEVER click — disables the declaration permanently |

---

## EXACT URL MAP (GK SMART 2025 Filing — Confirmed 2026-03-26)

```
GDT Login:          https://owp.tax.gov.kh/gdtowpcoreweb/login
GDT Application:    https://owp.tax.gov.kh/gdtowpcoreweb/coremgm/application
TOI Dashboard:      https://toi.tax.gov.kh/gdttoiweb/
GK SMART Detail:    https://toi.tax.gov.kh/gdttoiweb/6201c01a/02fb9ed1
GK SMART 2025:      https://toi.tax.gov.kh/gdttoiweb/6201c01a/64ed586d
Data Entry (form):  Opens from ⋮ → Data Entry on the Declaration List page
```

---

## DEPLOYMENT PROTOCOL (if code changes are made)

**ALWAYS in this order:**
1. `gcloud builds submit` → Cloud Run image build
2. `gcloud run deploy iews-toi` → Deploy to Cloud Run
3. Verify Cloud Run revision is live
4. `npm run build` (in `client/`) → `firebase deploy --only hosting` → Firebase

**NEVER deploy Firebase before Cloud Run.**

---
*Last updated: 2026-03-26 by Antigravity*
*Session: GDT Live Filing — All 3 navigation steps confirmed live. Steps 6-8 are FINAL and VERIFIED.*
