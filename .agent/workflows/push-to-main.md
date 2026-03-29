---
description: Push tested local changes to git main branch and deploy to Cloud Run
---

// turbo-all

## When to Use
Run this workflow ONLY after features have been tested and verified on localhost:3000.
This pushes changes live to: https://iews-toi-588941282431.asia-southeast1.run.app

## Steps

1. Build the React client (creates fresh production bundle in /client/dist)
   ```
   cd e:\Antigravity\TOI\client && npm run build
   ```

2. Commit all changes to git with a descriptive message
   ```
   cd e:\Antigravity\TOI && git add -A && git commit -m "feat: describe what was built and tested"
   ```

3. Push to main branch (triggers cloud awareness)
   ```
   cd e:\Antigravity\TOI && git push origin main
   ```

4. Deploy the server to Cloud Run (includes the new frontend dist)
   ```
   cd e:\Antigravity\TOI\server && gcloud run deploy iews-toi --source . --region asia-southeast1 --allow-unauthenticated
   ```

5. Verify the live deployment is healthy
   ```
   curl https://iews-toi-588941282431.asia-southeast1.run.app/health
   ```

## Notes
- Step 1 (build) is required — Cloud Run serves the built /client/dist, not Vite dev server
- The commit message should clearly describe the feature (e.g. "feat: IEWS package manager UI")
- Cloud Run deploy takes ~3-5 minutes — check the console for progress
- If deploy fails, check: gcloud run services describe iews-toi --region asia-southeast1
