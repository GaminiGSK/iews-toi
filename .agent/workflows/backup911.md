---
description: Secure current work to an emergency backup branch on GitHub
---

1. Run the backup911 script to commit and force-push all local changes to the 'backup-emergency' branch.
// turbo
2. Execute the PowerShell script:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/backup911.ps1
```
3. Confirm the push status to ensure the code is safely in the cloud.
