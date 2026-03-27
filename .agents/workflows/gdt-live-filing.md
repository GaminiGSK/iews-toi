---
description: GDT e-Tax Portal Login & TOI Filing — Full Agent Execution Routine
---

# GDT Live Filing Workflow
## For: BA TOI Agent & BA Audit Agent — STAND-ALONE EXECUTION

> **CARVED IN IRON — 2026-03-26 — VERIFIED LIVE SESSION**
> The user will communicate via BA agent chat. The BA agent executes this entire routine autonomously.
> The ONLY human input needed: **OTP code** (from email, expires 3 min).

---

## PRE-REQUISITES

### Who is filing?
- Identify the company from the logged-in user's JWT token (`req.user.companyCode`)
- Every company stores its own GDT credentials in MongoDB `CompanyProfile`

### Get GDT Credentials for ANY company (BA Agent Method)
```
GET /api/company/gdt-credentials
Authorization: Bearer <user_token>
```
Returns: `{ gdtUsername, gdtPassword, companyCode, companyNameEn }`

### GK SMART Confirmed Credentials (2026-03-26 verified)
- **GDT Login Email**: `gamini@ggmt.sg`
- **GDT Password**: stored in MongoDB `CompanyProfile.gdtPassword` for `GK_SMART_AI`
- **OTP sent to**: `gamini@ggmt.sg`
- **TIN**: K009-902103452
- **Barcode 2025**: OTOI2026032427869

---

## ═══════════════════════════════════════════════
## PHASE A — GDT PORTAL LOGIN
## ═══════════════════════════════════════════════

### 🔩 STEP 1 — Open GDT Login Page

```
URL: https://owp.tax.gov.kh/gdtowpcoreweb/login
Wait: 8 seconds after load
```

The page shows 3 tabs: **MOI ID** | **Email** | **TID**

### 🔩 STEP 2 — Login via Email Tab

> ⚠️ ALWAYS use the **Email** tab. NEVER use TID tab for email-based accounts.

1. Click **Email** tab (middle tab)
2. Click Email field → Ctrl+A → Delete → Type: `gamini@ggmt.sg`
3. Click Password field → Type: `[read from MongoDB gdtPassword]`
4. Click blue **Login** button
5. Wait 5 seconds

### 🔩 STEP 3 — Handle OTP

You land at: `https://owp.tax.gov.kh/gdtowpcoreweb/verify-code`

**ACTION**: Ask user immediately:
> "GDT sent a 6-digit OTP to gamini@ggmt.sg. Please check your email and give me the code. (It expires in 3 minutes)"

- Type OTP into the 6 boxes
- Click **Verify**

### 🔩 STEP 4 — GDT Application Dashboard

After OTP: `https://owp.tax.gov.kh/gdtowpcoreweb/coremgm/application`

Find and click: **"Tax on Income - ToI E-Filing"** module card.

---

## ═══════════════════════════════════════════════
## PHASE B — TOI SYSTEM NAVIGATION (3 CARVED STEPS)
## ═══════════════════════════════════════════════

### 🔩 STEP 5 — TOI Dashboard → Detail Information

**URL**: `https://toi.tax.gov.kh/gdttoiweb/`

1. Find the target company row (e.g. **GK SMART**)
2. Click **⋮** (three dots) on that row
3. Click **"Detail Information"**

→ Lands on: `https://toi.tax.gov.kh/gdttoiweb/6201c01a/02fb9ed1`

### 🔩 STEP 6 — Declaration History → View Detail (2025 row)

**You are on the Declaration History page.**

| # | Tax Year | Status | Request Status |
|---|---|---|---|
| 1 | **2025** | **Not Paid** | **Not yet submitted** |
| 2 | 2024 | Paid | Submitted |

1. Find row **Tax Year 2025** (Not Paid / Not yet submitted)
2. Click **⋮** on that row
3. Click **"View Detail"** ← NOT "Disable"!

→ Lands on: `https://toi.tax.gov.kh/gdttoiweb/6201c01a/64ed586d`

### 🔩 STEP 7 — Declaration List → Data Entry

**You are on the Declaration List page.**
- Shows: Headquarter table with 2025 row (Barcode: OTOI2026032427869, Not Paid)
- Shows: Attachments required (Balance Sheet / Income Statement / Other Documents)
- Shows: Branches — empty (no branches)

1. In the **Headquarter** table, find the 2025 row
2. Click **⋮** on that row
3. Click **"Data Entry"**

→ Opens the 17-step TOI form at:
`https://toi.tax.gov.kh/gdttoiweb/a1ce70a4/ae3675ba/1cd1a83c9431`

---

## ═══════════════════════════════════════════════
## PHASE C — TOI FORM DATA ENTRY (17 STEPS)
## ═══════════════════════════════════════════════

### CONTEXT: GK SMART 2025 Financial Profile
```
Company:         GK SMART (ជីខេ ស្អាត) — Sole Proprietorship
TIN:             K009-902103452
Director/Owner:  Gunasingha KASSAPA GAMINI
Tax Period:      01-2025 to 12-2025 (12 months)
Tax Rate:        20%
Compliance:      None (no Gold/Silver/Bronze)
Audit Required:  No
Accounting SW:   GK SMART AI (Using accounting software)
Share Capital:   83,795.08 USD = ~335,180,320 KHR (@ ~4,000 KHR/USD)
Net P&L 2025:    Loss (service company)
COGS:            0 (service company — no COGS)
Interest:        0
Charitable:      0
Branches:        0
```

### Get live data before filling:
```
GET /api/company/toi/autofill?year=2025
Authorization: Bearer <token>
```

---

### 📋 STEP 1/17 — Information of Enterprise

**What's pre-filled** (verify, don't change):
- Tax Period: 01-2025 to 12-2025 ✅
- Company Name, TIN, Director ✅

**Fields to fill/verify**:
| Field | Value |
|---|---|
| Status of Tax Compliance | **None** (radio button) |
| Accounting Holdings | **Proper accounting records** |
| Accounting Records | **Using accounting software** |
| Name of Program | **GK SMART AI** |
| Name of Accountant | **Gunasingha KASSAPA GAMINI** |
| Statutory Audit Requirement | **Not Required** |
| Income Tax Rate | **20%** |

Click **Next (2)**

---

### 📋 STEP 2/17 — Shareholders

**Fill Section A (Khmer shareholders) and Section B (Foreign shareholders)**:
- GK SMART has 1 owner → enter in BOTH sections:

| Field | Value |
|---|---|
| Shareholder Name | GUNASINGHA KASSAPA GAMINI |
| Address | #Arakawa Residence Block Unit D414, 4th Floor, Phum Phsar Teuk Thla, Sangkat Teuk Thla, Khan Sen Sok, Phnom Penh |
| Position | Owner |
| Beginning % | 100 |
| Beginning Amount (KHR) | 335,180,320 |
| Ending % | 100 |
| Ending Amount (KHR) | 335,180,320 |

Click **Next (3)**

---

### 📋 STEP 3/17 — Employees & Compensation

**Shareholding Managers section**:
| Field | Value |
|---|---|
| Description | Managing Director |
| Number | 1 |
| Annual Salary (KHR) | 24,000,000 |
| Fringe Benefits | 0 |

**Total Employees section**:
| Field | Value |
|---|---|
| Position/Category | Managing Director |
| Khmer | 1 |
| Foreigner | 0 |
| Total | 1 |
| Annual Salary | 24,000,000 |
| Fringe Benefits | 0 |

Click **Next (4)**

---

### 📋 STEP 4/17 — Balance Sheet

**CRITICAL INSTRUCTION:** Do NOT use hardcoded numbers. You MUST fetch the actual 2025 numbers dynamically from the API endpoint:
`GET /api/company/toi/autofill?year=2025`

From the JSON response, map the fields exactly to their respective layout locations:
- "Cash in bank" (A22): Use `formData.pe_asset_info` -> "Cash & bank equivalent" OR `formData.bs_cash`
- "Plant and equipment" (A7/A07): Use `formData.bs_ppe_nbv` (Net Book Value of PPE)
- "Other long-term assets" (A12): Use `formData.bs_total_assets - (A7 + A22)` to balance.
- "Paid in capital" (A30): Use `formData.pe_owners_equity`
- "Profit/loss for the period" (A36): Use `formData.pe_net_profit`

> ⚠️ Total Assets MUST equal Total Equity + Liabilities.

Click **Next (5)**

---

### 📋 STEP 5/17 — Income Statement

**CRITICAL INSTRUCTION:** Do NOT use hardcoded numbers. Fetch the actual 2025 numbers using:
`GET /api/company/toi/autofill?year=2025`

From the JSON response, map the fields:
- Interest Income (B15): Use `formData.is_interest_income`
- Salary & Wages (B23): Use `formData.is_salary_wages`
- Depreciation (B36): Use `formData.is_depreciation`
- Consulting/business register (B33): Use `formData.is_consulting`
- Other expenses (B41): Use `formData.is_other_ope`

> The net profit calculated at the bottom MUST perfectly match A36 from Step 4.

> System auto-calculates totals (B42 = Total expenses, B46 = PBT/loss)

Click **Next (6)**

---

### 📋 STEP 6/17 — COGS Non-Production

> GK SMART is a **service company** — NO COGS.
> Leave ALL fields empty/0.

Click **Next (7)**

---

### 📋 STEP 7/17 — COGS Production

> GK SMART is a **service company** — NOT APPLICABLE.
> Leave ALL fields empty.

Click **Next (8)**

---

### 📋 STEP 8/17 — Income Tax Adjustments (Add-backs & Deductions)

**Add-backs (non-deductible expenses)**:

| Row | Description | Amount (KHR) |
|---|---|---|
| E1 | Accounting Profit/Loss (= B46) | -170,944,880 |
| E2 | Accounting Depreciation (add back) | 45,908,760 |
| E13 | Owner/Director remuneration (non-deductible for sole prop) | 24,000,000 |

**Deductions (GDT-approved)**:

| Row | Description | Amount (KHR) |
|---|---|---|
| E26 | GDT Tax-Allowable Depreciation | 53,386,000 |

Click **Next (9)**

---

### 📋 STEP 9/17 — Loss Carryforward

| Section | Description | Amount (KHR) |
|---|---|---|
| E41 | Accumulated taxable losses b/fwd | 81,987,380 (from 2024) |
| E42 | Taxable Income (auto-calculated: max 0, E40-E41) | 0 (loss company) |

**Loss Carryforward Table**:

| Year | Loss Amount (KHR) |
|---|---|
| N-1 (2024) | 81,987,380 |
| N (2025) | 154,860,880 |

Click **Next (10)**

---

### 📋 STEP 10/17 — Tax Depreciation Detail (Asset Pools)

GK SMART has 3 fixed assets in 2 depreciation classes:

**Class 3 (25% declining balance) — Computers & Automobiles**:

| Field | Value |
|---|---|
| Historical Cost | [Computer cost + Auto cost combined in KHR] |

**Class 4 (20% declining balance) — Furniture & Fixtures**:

| Field | Value |
|---|---|
| Historical Cost | [Furniture cost in KHR] |

> Get exact values from `/api/company/assets` or Asset & Depreciation module

Click **Next (11)**

---

### 📋 STEP 11/17 — Charitable & Interest Cap

**Charitable (F-rows)**:
- F2 = 0 (GK SMART makes no charitable donations)
- All F-rows = 0

**Interest Cap (G-rows)**:
- G2 = 0 (GK SMART has no interest expense)
- All G-rows = 0

Click **Next (12)**

---

### 📋 STEP 12/17 — Interest & Loss Carryforward Tables

> Auto-populated from Step 9 and Step 11
> Verify totals are correct
> No manual entry needed if G-rows and loss tables were filled in Step 9

Click **Next (13)**

---

### 📋 STEP 13/17 — Transfer Pricing / Related Parties

> GK SMART has NO related party transactions.

- Answer **"No"** to the Transfer Pricing documentation question
- Leave all tables empty

Click **Next (14)**

---

### 📋 STEP 14/17 — Related Party Transactions Detail

> NOT APPLICABLE for GK SMART.
> Leave empty.

Click **Next (15)**

---

### 📋 STEP 15/17 — Fixed Asset Details

List all 3 GK SMART fixed assets:

| # | Asset Name | Type | Acquisition Date | Historical Cost (KHR) |
|---|---|---|---|---|
| 1 | Furniture | Furniture & Fixtures | [date] | [cost from DB] |
| 2 | Computer | Computer Equipment | [date] | [cost from DB] |
| 3 | Automobile | Motor Vehicle | [date] | [cost from DB] |

> Get from: `/api/company/assets` or Asset & Depreciation module in GK SMART dashboard

Click **Next (16)**

---

### 📋 STEP 16/17 — Excess Income Tax (Mining/Oil)

> **NOT APPLICABLE** for GK SMART.
> Leave ALL fields (X1-X5) empty.

Click **Next (17)**

---

### 📋 STEP 17/17 — DECLARATION & FILE UPLOAD ← FINAL STEP

**This is the last step before submission.**

**3 Files must be uploaded BEFORE submitting**:

| # | Required File | What to Upload |
|---|---|---|
| 1 | **Balance Sheet** | PDF of 2025 Annual Balance Sheet from GK SMART system |
| 2 | **Income Statement** | PDF of 2025 Annual Income Statement from GK SMART system |
| 3 | **Other Documents** | Trial Balance OR Fixed Asset Register PDF |

**How to generate these files from GK SMART**:
1. Open GK SMART → Financial Statements → Select Year 2025 → Export PDF
2. Or: GK SMART → Trial Balance → Export PDF

**After uploading all 3 files**:
- Verify Income Tax Due = 0 KHR (loss company, no tax payable)
- Verify signatory: Gunasingha KASSAPA GAMINI, Managing Director
- Verify date: [filing date]
- Ask user: **"Ready to submit? Please confirm YES to proceed."**
- User confirms → Click **Submit / Confirm Declaration**

---

## GDT SYSTEM SCHEDULE

| Day | Hours (Cambodia Time, UTC+7) |
|---|---|
| Monday–Friday | 08:00 – 18:00 |
| Saturday | 08:00 – 12:00 |
| Sunday | CLOSED |

> ⚠️ GDT shuts down at **18:00 Cambodia time** (11:00 UTC). Session will fail if filed after this time. Plan accordingly.

---

## EXACT URL MAP (GK SMART 2025 — Verified 2026-03-26)

```
GDT Login:              https://owp.tax.gov.kh/gdtowpcoreweb/login
GDT OTP Verify:         https://owp.tax.gov.kh/gdtowpcoreweb/verify-code
GDT Application Hub:    https://owp.tax.gov.kh/gdtowpcoreweb/coremgm/application
TOI Dashboard:          https://toi.tax.gov.kh/gdttoiweb/
GK SMART Detail:        https://toi.tax.gov.kh/gdttoiweb/6201c01a/02fb9ed1
GK SMART 2025 Decl:     https://toi.tax.gov.kh/gdttoiweb/6201c01a/64ed586d
Data Entry (form):      https://toi.tax.gov.kh/gdttoiweb/a1ce70a4/ae3675ba/1cd1a83c9431
```

---

## KNOWN ISSUES & ANTI-PATTERNS

| Issue | Solution |
|---|---|
| TID tab fails for email accounts | Always use **Email** tab |
| OTP expires in 3 min | Ask user IMMEDIATELY after clicking Login |
| GDT closes at 18:00 KH time | File during 08:00–17:30 window only |
| Session killed after GDT shutdown | Must re-login on next session |
| "Disable" in ⋮ menu | **NEVER CLICK** — permanently disables declaration |
| Step 15 asset list blocks Next | Must fill at least 1 asset row with valid date & cost |
| Balance Sheet must balance | Total Assets MUST equal Total Equity+Liabilities |
| Puppeteer headless blocked by GDT | Use real browser subagent only (not server-side) |

---

## DEPLOYMENT PROTOCOL (when code changes are made)

**ENFORCED ORDER — NEVER DEVIATE**:
```
1. gcloud builds submit --project ambient-airlock-286506
2. gcloud run deploy iews-toi --region asia-southeast1 --project ambient-airlock-286506
3. cd client && npm run build
4. firebase deploy --only hosting --project ambient-airlock-286506
```

**Current Revision**: `iews-toi-00928-clx`
**Firebase**: `https://gksmart-ai-app.web.app`
**Cloud Run**: `https://iews-toi-588941282431.asia-southeast1.run.app`

---

## BA AGENT BRIEFING (READ THIS FIRST)

### You are BA TOI or BA Audit. Here is your mission:
1. User says: "file TOI" or "submit TOI" or "continue TOI filing"
2. You execute this entire workflow from login to Step 17
3. You pause ONLY to ask for OTP
4. You pause at Step 17 to confirm before final submit
5. If GDT is offline (after 18:00 KH), tell user: "GDT system is closed. Filing hours: Mon-Fri 08:00-18:00 Cambodia time. Please try again tomorrow."

### What you must NOT do:
- Do NOT ask user for credentials — read from MongoDB
- Do NOT guess financial figures — call `/api/company/toi/autofill?year=2025`
- Do NOT submit without user confirmation at Step 17
- Do NOT click "Disable" at any point
- Do NOT use TID tab for login

---
*LANDMARK: Session 2026-03-26 | Steps 1–16 completed, Step 17 reached (GDT offline 18:00)*
*Next session: Login → navigate to Data Entry (draft saved) → Step 17 → upload 3 files → confirm → submit*
*Updated by: Antigravity — carved in iron, permanent*
