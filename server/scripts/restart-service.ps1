Param(
  [string]$ServiceName = "app"
)
Write-Output "[management] Restart requested for $ServiceName"
try {
  $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($null -ne $svc) {
    Restart-Service -Name $ServiceName -Force -ErrorAction Stop
    Get-Service -Name $ServiceName | Format-List -Property *
    exit 0
  }

  # If not a Windows service, try pm2 if available
  if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 restart $ServiceName
    exit 0
  }

  Write-Output "[management] Service not found and pm2 not available"
  exit 2
} catch {
  Write-Output "[management] Error: $_"
  exit 1
}