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

## STEP 6 — Inside the TOI Filing System

On the TOI dashboard at `https://toi.tax.gov.kh/gdttoiweb/`:
1. Find the GK SMART entry in the company list
2. Click the **⋮ (more options)** menu on the GK SMART row
3. Available actions will appear (e.g., Edit Filing, View, Submit)
4. Proceed with whatever filing action is needed

> **Note**: The previous session reached this point and was at the final submission step for TOI Form (21 pages, 134 fields). If continuing from a previous session, check if a draft already exists.

---

## KNOWN ISSUES & NOTES

| Issue | Resolution |
|---|---|
| TID tab fails for email accounts | Always use **Email tab** |
| OTP expires in ~3 min | Ask user immediately after Login is clicked |
| Sessions are not persisted in DB | Each BA session needs a fresh login |
| Server-side Puppeteer fails on GDT | GDT blocks headless bots — use real browser subagent only |
| Password not visible in UI | Read from MongoDB `gdtPassword` field directly |

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
*Session: GDT Live Filing — Login confirmed working, TOI module navigated*
