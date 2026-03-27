# AI Interaction Rules

**Critical rule added by user request on 2026-03-11:**
- DO NOT use the browser subagent to check or open `localhost` (e.g., `http://localhost:5173`) to verify UI changes unless EXPLICITLY requested by the user.
- The user prefers to review the internal setup or source code themselves or provide screenshots.
- Avoid unnecessary browser recordings of `localhost` to save time and prevent unwanted visual interruptions.

## ⛰️ STONE-CARVED RULE: GDT Portal Automation (NEVER CHANGE, NEVER FORGET)

**Set by user. Violation = wasted day. Read before touching ANYTHING GDT-related.**

### The Law: GDT Filing MUST happen visibly, in front of the human's eyes.

1. **Click green button → GDT website pops open IN A NEW BROWSER WINDOW** (visible, not hidden)
2. **Agent AUTO-FILLS the TID/username field** — user watches it type on screen
3. **Agent AUTO-FILLS the password field** — user watches on screen  
4. **Agent clicks the Send Code button** — user watches
5. **GDT sends OTP to company owner's registered phone/email**
6. **Company owner sits in front of screen, types the OTP code when received**
7. **Agent submits the OTP** — user watches
8. **After login: agent proceeds through the TOI tabs** — all visible on screen

### What is FORBIDDEN:
- ❌ Headless/hidden browser (Puppeteer headless mode)
- ❌ Server-side HTTP requests pretending to be the browser (axios login)
- ❌ Anything that happens BEHIND the screen without the human watching
- ❌ Telling the user to "copy-paste" credentials manually — the AGENT fills them

### Technical Implementation Rule:
- The GDT relay page must open in the USER'S browser (client-side window.open)
- Auto-fill must use JavaScript injected via a server-side proxy page OR a relay HTML page
- The proxy page URL: `/api/company/gdt-relay?token=...` — server fetches GDT, injects auto-fill JS, returns to user's tab
- After auto-fill and Send Code click: platform shows OTP input activated
- After OTP: agent handles remaining TOI filing steps on GDT — still visibly on screen

### This rule was set: 2026-03-27 by the platform owner.
