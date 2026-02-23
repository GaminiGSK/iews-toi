# backup911.ps1 - Emergency Disaster Recovery Script

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupBranch = "backup-emergency"

Write-Host "🚨 Initializing backup911 at $timestamp..." -ForegroundColor Red

# 1. Check Git Status
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to backup. Local matches remote." -ForegroundColor Green
    exit 0
}

Write-Host "📦 Found changes. Preparing emergency snapshot..." -ForegroundColor Yellow

# 2. Add and Commit
git add -A
git commit -m "🚨 EMERGENCY BACKUP-911: $timestamp"

# 3. Handle Branching
$currentBranch = git branch --show-current
Write-Host "Current Branch: $currentBranch"

# Ensure backup branch exists locally, if not create from current
$branchExists = git branch --list $backupBranch
if (-not $branchExists) {
    Write-Host "Creating emergency branch: $backupBranch"
    git branch $backupBranch
}

# 4. Push to Remote
Write-Host "🚀 Pushing to $backupBranch..." -ForegroundColor Cyan
git push origin "$($currentBranch):$($backupBranch)" --force

Write-Host "✅ backup911 Complete! Work secured to branch: $backupBranch" -ForegroundColor Green
Write-Host "To restore: git checkout $backupBranch" -ForegroundColor Gray
