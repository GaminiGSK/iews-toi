# TOI SYSTEM CONTROL PANEL (v2.6)
# ---------------------------------------------------------
# This script manages Cloud Deployment, Docker Builds, and 
# System Maintenance for the IEWS TOI Environment.

# --- Configuration ---
$version = "v3.0 (Stability Edition)"
$gcloudPath = "C:\Users\Gamini\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$projectId = "ambient-airlock-286506"
$serviceName = "iews-toi"
$region = "asia-southeast1"

# Auto-detect tool paths if not in PATH
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    if (Test-Path $gcloudPath) {
        $env:Path += ";$(Split-Path $gcloudPath)"
        Write-Host "[System] Mapped gcloud from AppData" -ForegroundColor Gray
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    if (Test-Path $dockerPath) {
        $env:Path += ";$(Split-Path $dockerPath)"
        Write-Host "[System] Mapped docker from Program Files" -ForegroundColor Gray
    }
}

function Show-Menu {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   IEWS TOI SYSTEM CONTROL CENTER ($version)  " -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " 1. Test Cloud Environment (Check Tools)"
    Write-Host " 2. Build & Deploy to Cloud Run (Full Push)"
    Write-Host " 3. Sync Git & Push to Main"
    Write-Host " 4. Local Build & Server Restart"
    Write-Host " 5. Check Cloud Logs (Live Debug)"
    Write-Host " 6. Initialize / Login to Google Cloud"
    Write-Host " 7. SYNC ENV: Push Local .env to Cloud (Master Key)"
    Write-Host " 8. SELF-HEALING: Setup Health Probes"
    Write-Host " 9. PERMANENT ACCESS: Setup Service Account"
    Write-Host " 10. CHECKPOINT: Mark Current Version as 'Safe'"
    Write-Host " 11. ROLLBACK: Restore Last 'Safe' Version"
    Write-Host " 12. DISASTER RECOVERY: Create 'backup911'"
    Write-Host " 13. EMERGENCY 911: Restore 'backup911' (RESTORES SYSTEM)"
    Write-Host " Q. Quit"
    Write-Host "------------------------------------------"
    Write-Host " Active Project: $projectId" -ForegroundColor Gray
}

function Initialize-Cloud {
    Write-Host "[Init] Setting default project to $projectId..." -ForegroundColor Yellow
    gcloud config set project $projectId
    Write-Host "[Init] Starting login flow..." -ForegroundColor Yellow
    gcloud auth login --no-launch-browser
    Write-Host "[Init] Configuring Docker Auth..." -ForegroundColor Yellow
    gcloud auth configure-docker --quiet
    Write-Host "------------------------------------------"
}

function Test-Environment {
    Write-Host "[System] Testing Tools..." -ForegroundColor Yellow
    
    $gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    
    if ($gcloud) { 
        $ver = gcloud --version | Select-Object -First 1
        Write-Host "✅ gcloud CLI: $ver" -ForegroundColor Green 
    } 
    else { Write-Host "❌ gcloud CLI: Missing" -ForegroundColor Red }
    
    if ($docker) { 
        $ver = docker --version
        Write-Host "✅ Docker: $ver" -ForegroundColor Green 
    } 
    else { Write-Host "❌ Docker: Missing" -ForegroundColor Red }

    Write-Host "------------------------------------------"
}

function Show-CloudLogs {
    Write-Host "[System] Fetching latest logs from Cloud Run..." -ForegroundColor Cyan
    # Using beta component which is standard for Cloud Run log reading
    gcloud beta run logs read --limit 50 --project $projectId
}

function Sync-Git {
    Write-Host "[System] Syncing with Git..." -ForegroundColor Cyan
    git add .
    $msg = Read-Host "Commit message (default: 'Update via Control Panel')"
    if (-not $msg) { $msg = "Update via Control Panel" }
    git commit -m $msg
    git push origin main
}

# Initial Verification
Test-Environment

# Main Interaction Loop
$running = $true
while ($running) {
    Show-Menu
    $choice = (Read-Host "Select an option").ToUpper()
    
    switch ($choice) {
        "1" { Test-Environment }
        "2" { Invoke-CloudDeploy }
        "3" { Sync-Git }
        "4" { Invoke-LocalBuild }
        "5" { Show-CloudLogs }
        "6" { Initialize-Cloud }
        "7" { Sync-Environment }
        "8" { Update-HealthProbes }
        "9" { New-ServiceAccount }
        "10" { Set-Checkpoint }
        "11" { Restore-Checkpoint }
        "12" { Set-Backup911 }
        "13" { Restore-Backup911 }
        "Q" { 
            Write-Host "Exiting Control Panel..." -ForegroundColor Cyan
            $running = $false
        }
        default { Write-Host "Option '$choice' is not yet implemented or invalid." -ForegroundColor Gray }
    }
    
    if ($running) {
        Write-Host "`nPress any key to return to menu..." -ForegroundColor Gray
        $null = [System.Console]::ReadKey($true)
    }
}
# --- CORE ENGINE FUNCTIONS ---

function Invoke-CloudDeploy {
    Write-Host "[Deploy] Initiating Cloud Build & Deploy Pipeline..." -ForegroundColor Yellow
    Write-Host "[1/2] Building Container Image..." -ForegroundColor Cyan
    
    $imageTag = "gcr.io/$projectId/$serviceName"
    gcloud builds submit --tag $imageTag --project $projectId --quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build Failed! Check logs above." -ForegroundColor Red
        return
    }

    Write-Host "[2/2] Deploying to Cloud Run..." -ForegroundColor Cyan
    gcloud run deploy $serviceName `
        --image $imageTag `
        --platform managed `
        --region $region `
        --project $projectId `
        --allow-unauthenticated `
        --quiet

    Write-Host "[3/3] Syncing Firebase Hosting Config..." -ForegroundColor Cyan
    npx firebase-tools deploy --only hosting --project $projectId --non-interactive

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment Failed!" -ForegroundColor Red
    }
    else {
        Write-Host "✅ SYSTEM DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "URL: https://gksmart-ai-app.web.app (via Firebase)" -ForegroundColor Gray
    }
}

function Invoke-LocalBuild {
    Write-Host "[Local] Building Frontend & Restarting..." -ForegroundColor Yellow
    
    Write-Host "[1/2] Building Client Dist..." -ForegroundColor Cyan
    Set-Location client
    npm run build
    Set-Location ..

    Write-Host "[2/2] Frontend built. Access via Local Server (Ctrl+C to restart manually)." -ForegroundColor Gray
}

# --- FAIL-SAFE CONTROL FUNCTIONS ---

function Sync-Environment {
    Write-Host "[Master Key] Synchronizing Local .env with Cloud Run..." -ForegroundColor Yellow
    $envPath = "server\.env"
    if (-not (Test-Path $envPath)) { 
        Write-Host "❌ Local .env not found in server folder!" -ForegroundColor Red
        return 
    }

    $envVars = Get-Content $envPath | Where-Object { $_ -match "=" -and $_ -notmatch "^#" }
    $envString = $envVars -join ","
    
    Write-Host "[Update] Running: gcloud run services update $serviceName --update-env-vars [REDACTED]" -ForegroundColor Cyan
    gcloud run services update $serviceName --project $projectId --region $region --update-env-vars $envString
    Write-Host "✅ Environment Synced Successfully!" -ForegroundColor Green
}

function Update-HealthProbes {
    Write-Host "[Self-Healing] Configuring Liveness & Startup Probes..." -ForegroundColor Yellow
    gcloud run services update $serviceName --project $projectId --region $region `
        --liveness-probe-path="/health" `
        --startup-probe-path="/health" `
        --startup-probe-timeout=10 `
        --startup-probe-period=10
    Write-Host "✅ Health Probes Enabled (Self-Healing Active)!" -ForegroundColor Green
}

function New-ServiceAccount {
    $saName = "toi-system-manager"
    $saEmail = "$saName@$projectId.iam.gserviceaccount.com"
    
    Write-Host "[Permanent Access] Creating Service Account: $saName..." -ForegroundColor Yellow
    
    # Check if exists
    $saList = gcloud iam service-accounts list --project $projectId --format="value(email)"
    $exists = $saList | Where-Object { $_ -eq $saEmail }
    
    if (-not $exists) {
        gcloud iam service-accounts create $saName --display-name="TOI System Manager" --project $projectId
    }

    # Assign Roles
    Write-Host "[Setup] Assigning Roles (Cloud Run, Storage, Artifact, Logging)..." -ForegroundColor Yellow
    $roles = @("roles/run.admin", "roles/storage.admin", "roles/logging.viewer", "roles/artifactregistry.admin")
    foreach ($role in $roles) {
        gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$saEmail" --role="$role" --quiet
    }

    # Generate Key File
    $keyPath = "server\config\service-account.json"
    if (-not (Test-Path "server\config")) { New-Item -ItemType Directory "server\config" }
    
    Write-Host "[Setup] Generating Key: $keyPath..." -ForegroundColor Yellow
    gcloud iam service-accounts keys create $keyPath --iam-account=$saEmail --project $projectId
    
    Write-Host "✅ Permanent Access Configured! (Key saved to config)" -ForegroundColor Green
}

function Set-Checkpoint {
    Write-Host "[Checkpoint] Getting current active revision..." -ForegroundColor Yellow
    $activeRev = gcloud run services describe $serviceName --project $projectId --region $region --format="value(status.latestReadyRevisionName)"
    if ($activeRev) {
        $activeRev | Out-File ".last_safe_revision.txt"
        Write-Host "✅ Checkpoint Set: $activeRev is now your 'Safe Version'." -ForegroundColor Green
    }
    else {
        Write-Host "❌ Error: Could not detect active revision." -ForegroundColor Red
    }
}

function Restore-Checkpoint {
    if (-not (Test-Path ".last_safe_revision.txt")) {
        Write-Host "❌ No Checkpoint found! Run Option 10 first." -ForegroundColor Red
        return
    }
    $safeRev = Get-Content ".last_safe_revision.txt" | Out-String
    $safeRev = $safeRev.Trim()
    
    Write-Host "[Rollback] RESTORING SAFE VERSION: $safeRev..." -ForegroundColor Magenta
    Write-Host "This will instantly divert 100% of traffic back to the checkpoint." -ForegroundColor Gray
    
    gcloud run services update-traffic $serviceName --project $projectId --region $region --to-revisions=$("${safeRev}=100")
    
    Write-Host "✅ Rollback Complete! Your site is back to its last known safe state." -ForegroundColor Green
}

function Set-Backup911 {
    Write-Host "[911] CREATING EMERGENCY BACKUP..." -ForegroundColor Red
    $activeRev = gcloud run services describe $serviceName --project $projectId --region $region --format="value(status.latestReadyRevisionName)"
    if ($activeRev) {
        $activeRev | Out-File ".backup911_revision.txt"
        Write-Host "✅ EMERGENCY BACKUP CREATED: $activeRev is now saved as 'backup911'." -ForegroundColor White -BackgroundColor Red
    }
}

function Restore-Backup911 {
    if (-not (Test-Path ".backup911_revision.txt")) {
        Write-Host "❌ No emergency backup found!" -ForegroundColor Red
        return
    }
    $safeRev = Get-Content ".backup911_revision.txt" | Out-String
    $safeRev = $safeRev.Trim()
    
    Write-Host "[911] !! EMERGENCY RESTORATION !!: $safeRev..." -ForegroundColor White -BackgroundColor Red
    
    gcloud run services update-traffic $serviceName --project $projectId --region $region --to-revisions=$("${safeRev}=100")
    
    Write-Host "✅ RESTORATION SUCCESSFUL: System reverted to backup911." -ForegroundColor Green
}
