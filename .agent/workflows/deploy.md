---
description: Deploy client build to Firebase Hosting + server to Cloud Run
---

// turbo-all

## Steps

1. Build the React client (generates fresh `/client/dist` with all JS/CSS assets)
   ```
   cd e:\Antigravity\TOI\client && npm run build
   ```

2. Deploy hosting to Firebase (pushes the new dist bundle)
   ```
   cd e:\Antigravity\TOI && firebase deploy --only hosting
   ```

3. Deploy server to Cloud Run (if server changes were made)
   ```
   cd e:\Antigravity\TOI\server && gcloud run deploy iews-toi --source . --region asia-southeast1 --allow-unauthenticated
   ```

4. Commit all changes to git
   ```
   cd e:\Antigravity\TOI && git add -A && git commit -m "deploy: firebase hosting + cloud run update"
   ```
