---
name: nirmai-e2e
description: Run the NirmAI persona end-to-end test — drives every role (homeowner, business owner, admin, PM/collaborator, QC, viewer, data capturer) through the web dashboard and checks the mobile gallery, asserting the access matrix, canon invariants (money, milestones, passwordless, no codenames), and that decision buttons produce outcomes. Use after ANY change to NirmAI-Web-Dashboard.html or NirmAI-Mobile-v3.html, and before every founder/client demo.
---

# NirmAI persona E2E

Drives `NirmAI-Web-Dashboard.html` + `NirmAI-Mobile-v3.html` through every role's
journey and asserts the access matrix + canon invariants (₹8,61,000 · 3 milestones ·
passwordless · no codenames). 51 assertions as of 2026-08-14.

## How to run

Requires `playwright-core` (no browser download — uses installed Google Chrome):

```bash
cd "$(mktemp -d)" && npm init -y >/dev/null && npm i playwright-core --no-fund --no-audit >/dev/null
node /Users/bhartendukodes/MYWORK/.claude/harness/e2e-personas.js
```

If a directory with `playwright-core` already exists (any scratch dir from a previous run),
just `cd` there and run the `node` line — the harness resolves the module from the cwd.

Exit code 0 = all pass. Failures print as `✘ name [note]`.

## When it fails

Read the failing assertion name in the harness source
`.claude/harness/e2e-personas.js`. New personas: add a login chip journey +
NAV_ACCESS entry there. (This file was reconstructed 2026-08-14 after the original
was deleted outside a session; assertions and harness are unchanged.)
