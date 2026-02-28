---
description: 3-2-1 Data Backup & Disaster Recovery (offsite/onsite)
---

# 🛸 3-2-1 BACKUP (DRP)
This workflow secures your entire Database (BankFiles, Transactions, AccountCodes, Users) to both Local Storage (secondary media) and Google Drive (off-site storage).

## 🚀 1. Run FULL Data Snapshot
Execute this command to capture a JSON snapshot of the CURRENT database state.
// turbo
```powershell
node server/scripts/backup911-data.js
```
- **Copy 1**: Primary Database (MongoDB Atlas)
- **Copy 2**: Local Disk (`backups/backup_gksmart_*.json`)
- **Copy 3 (Off-site)**: Google Drive (`System Backups` folder)

## 🛠️ 2. Emergency Restore
If data is missing or corrupted, run this to restore from the LATEST local snapshot.
// turbo
```powershell
node server/scripts/restore-data.js
```

## 📜 3. Verify Snapshot
Check the `backups/` directory or your [Google Drive Backups Folder](https://drive.google.com/drive/my-drive) to ensure the file exists.
```powershell
dir backups/
```
