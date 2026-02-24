# Standing Order: Cloud Run Deployment Configuration
# ---------------------------------------------------------
# MANDATORY: This project MUST ONLY be deployed to the following target.
# Any deviation from this is strictly prohibited.

ACTIVE_PROJECT_ID=ambient-airlock-286506
ACTIVE_SERVICE_NAME=iews-toi
ACTIVE_REGION=asia-southeast1
ACTIVE_URL=https://gksmart-ai-app.web.app

# BACKUP_911_REVISION: The last known safe state for emergency restoration.
BACKUP_911_REVISION=iews-toi-00514-hmb

# Verification Rule: 
# Every 'gcloud run' or 'gcloud builds' command must include:
# --project $ACTIVE_PROJECT_ID --region $ACTIVE_REGION
