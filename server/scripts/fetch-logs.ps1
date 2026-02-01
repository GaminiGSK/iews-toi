Param(
  [string]$LogPath = "C:\ProgramData\MyApp\logs\app.log",
  [int]$Lines = 200
)
if (Test-Path $LogPath) {
  Get-Content -Path $LogPath -Tail $Lines
  exit 0
} else {
  Write-Output "[management] Log file $LogPath not found"
  exit 2
}