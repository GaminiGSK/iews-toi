---
description: Standing rules — what the AI agent is and is NOT allowed to do
---

# ⛔ STANDING RULES — READ BEFORE ANY ACTION

## RULE 1: NO TOUCH ON LIVE / CLOUD RUN — EVER

The agent is **STRICTLY FORBIDDEN** from doing any of the following without explicit human confirmation:

- `gcloud run deploy` — deploying anything to Cloud Run
- `git push` — pushing to any remote branch
- `npm run build` — building production bundles intended for deployment
- `firebase deploy` — deploying to Firebase hosting
- Connecting to or modifying the live URL: `https://iews-toi-588941282431.asia-southeast1.run.app`
- Opening browser sessions against the live Cloud Run URL to test changes

## RULE 2: LOCALHOST ONLY FOR ALL DEVELOPMENT WORK

All development, testing, and feature building happens at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

The agent edits SOURCE FILES only (`e:\Antigravity\TOI\client\src\` and `e:\Antigravity\TOI\server\`).
Vite hot-reload handles the rest locally.

## RULE 3: GIT PULL IS ALLOWED — GIT PUSH IS NOT

- ✅ `git pull origin main` — allowed (sync latest from remote)
- ✅ `git status`, `git log`, `git diff` — allowed (read-only inspection)
- ❌ `git push` — NOT allowed without human saying "push to main"
- ❌ `git commit` alone before human approval — NOT recommended

## RULE 4: DEPLOY ONLY ON EXPLICIT HUMAN INSTRUCTION

The agent only runs the `/push-to-main` workflow when the human explicitly says:
> "Push to main" or "Deploy to Cloud Run" or "Go live"

Any other instruction is treated as LOCAL ONLY work.

---

**Set by:** User on 2026-03-29
**Enforced by:** Agent must check this file before any git or deploy command
