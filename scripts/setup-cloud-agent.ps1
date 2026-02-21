# setup-cloud-agent.ps1
# This script automates the creation of the Cloud Service Account for Antigravity

$projectID = gcloud config get-value project
if (-not $projectID) {
    Write-Host "❌ Error: No default GCP project found. Run 'gcloud config set project [PROJECT_ID]' first." -ForegroundColor Red
    exit 1
}

$saName = "antigravity-cloud-agent"
$saEmail = "$saName@$projectID.iam.gserviceaccount.com"

Write-Host "🔧 Setting up Cloud Agent for project: $projectID" -ForegroundColor Cyan

# 1. Create Service Account
Write-Host "Creating Service Account..."
gcloud iam service-accounts create $saName --display-name="Antigravity Cloud Agent" 2>$null

# 2. Assign Roles
$roles = @(
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer",
    "roles/cloudbuild.builds.builder",
    "roles/firebase.admin",
    "roles/storage.admin"
)

foreach ($role in $roles) {
    Write-Host "Assigning role: $role"
    gcloud projects add-iam-policy-binding $projectID --member="serviceAccount:$saEmail" --role="$role" --quiet | Out-Null
}

# 3. Generate JSON Key
$keyFile = "antigravity-cloud-key.json"
Write-Host "Generating JSON key: $keyFile"
gcloud iam service-accounts keys create $keyFile --iam-account=$saEmail

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "--------------------------------------------------"
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open GitHub: https://github.com/GaminiGSK/iews-toi/settings/secrets/actions"
Write-Host "2. Add a new secret named: GCP_SA_KEY"
Write-Host "3. Paste the contents of '$keyFile' into that secret."
Write-Host "4. DELETE the '$keyFile' from your laptop after uploading!" -ForegroundColor Red
Write-Host "--------------------------------------------------"
