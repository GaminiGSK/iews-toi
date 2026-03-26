# Standing Order: Cloud Run Deployment Configuration
# ---------------------------------------------------------
# MANDATORY: This project MUST ONLY be deployed to the following target.
# Any deviation from this is strictly prohibited.

ACTIVE_PROJECT_ID=ambient-airlock-286506
ACTIVE_SERVICE_NAME=iews-toi
ACTIVE_REGION=asia-southeast1
ACTIVE_URL=https://gksmart-ai-app.web.app
CLOUD_RUN_URL=https://iews-toi-588941282431.asia-southeast1.run.app

# BACKUP_911_REVISION: The last known safe state for emergency restoration.
BACKUP_911_REVISION=iews-toi-00928-clx

# LANDMARK TAG: v1.0-TOI-GL-VERIFIED-2026-03-26
# GL->TB->FS->TOI chain verified. 134 fields, 21 pages.
# Firebase: https://gksmart-ai-app.web.app

# -------------------------------------------------------
# GDT e-TAX PORTAL CREDENTIALS (for BA Agentic Filing)
# -------------------------------------------------------
# Stored in MongoDB — CompanyProfile for companyCode: GK_SMART_AI
# Fields: gdtUsername, gdtPassword
# GDT Login URL: https://owp.tax.gov.kh/gdtowpcoreweb/login
# Login Tab to use: EMAIL (NOT TID, NOT MOI ID)
# Email: gamini@ggmt.sg
# Password: read from DB (gdtPassword field) — do NOT hardcode here
# OTP: sent to gamini@ggmt.sg — expires in ~3 minutes
# TOI System URL (after login): https://toi.tax.gov.kh/gdttoiweb/
#
# FULL WORKFLOW: See .agents/workflows/gdt-live-filing.md
# USE SLASH COMMAND: /gdt-live-filing

# -------------------------------------------------------
# Verification Rule:
# Every 'gcloud run' or 'gcloud builds' command must include:
# --project $ACTIVE_PROJECT_ID --region $ACTIVE_REGION
#
# DEPLOYMENT ORDER (ENFORCED):
# 1. gcloud builds submit (build image)
# 2. gcloud run deploy    (deploy backend FIRST)
# 3. npm run build        (build frontend)
# 4. firebase deploy      (deploy frontend LAST)
# NEVER deploy Firebase before Cloud Run.
