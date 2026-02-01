Param(
  [string]$Branch = "main"
)
Write-Output "[management] Deploy requested for branch $Branch"
try {
  $repoPath = Split-Path -Parent $PSScriptRoot
  Set-Location $repoPath

  git fetch origin
  git checkout $Branch
  git pull origin $Branch

  if (Test-Path package.json) {
    npm ci
    npm run build
  }

  if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 restart all
  } else {
    if (Get-Service -Name "app" -ErrorAction SilentlyContinue) {
      Restart-Service -Name "app" -Force
    } else {
      Write-Output "[management] No service 'app' to restart"
    }
  }
  exit 0
} catch {
  Write-Output "[management] Error: $_"
  exit 1
}