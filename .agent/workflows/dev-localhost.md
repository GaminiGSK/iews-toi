---
description: Start local dev environment — Backend on :5000, Frontend on :3000
---

// turbo-all

## Architecture
- **Backend** (Express/Node): `http://localhost:5000`
- **Frontend** (Vite/React): `http://localhost:3000`
- Vite automatically proxies all `/api/*` calls from :3000 → :5000
- Test the app at: **http://localhost:3000**

## Steps

1. Start the backend server (runs on port 5000 with nodemon auto-restart)
   ```
   cd e:\Antigravity\TOI\server && npm run dev
   ```

2. In a NEW terminal, start the frontend dev server (runs on port 3000)
   ```
   cd e:\Antigravity\TOI\client && npm run dev
   ```

3. Open the browser and navigate to:
   ```
   http://localhost:3000
   ```

## Notes
- Both terminals must stay running during development
- Save any file — Vite will hot-reload the frontend instantly
- Save any server file — nodemon will auto-restart the backend
- Login credentials for testing:
  - Superadmin: username=`Admin`, code=`999999`
  - Unit user: username=`GKSMART`, code=`666666`
- All API calls proxy through Vite — no CORS issues on localhost
