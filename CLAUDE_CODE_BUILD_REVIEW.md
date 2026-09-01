# Claude Code review handoff — Cloud environment Builds

**Owner:** Benjamin  
**Reviewer:** Claude Code  
**Repo:** https://github.com/Bphill10/wellpept.com  
**Branch:** `cursor/cloud-agent-environment-build-928b`  
**PR:** https://github.com/Bphill10/wellpept.com/pull/1  
**Base:** `main` @ `31fad72`  
**Cursor agent:** https://cursor.com/agents/bc-7a64f419-6ed5-4ecb-acf5-91c55497928b  

After review, leave a short `CURSOR_RETURN.md` with verdict, findings, and any requested follow-ups. Do not force-push. Do not merge unless Benjamin asks.

---

## Mission

Review the Cloud Agent **environment Builds** setup Cursor just added. This is infrastructure for faster agent boots, not product/UI work.

Do **not** reopen glass-shatter, catalog vial, or calculator wrap work unless a build-config change accidentally broke them. That product work was already published on `main` in `31fad72`.

---

## What Cursor changed

| Path | Purpose |
|------|---------|
| `.cursor/environment.json` | Cloud install + Vite terminal |
| `AGENTS.md` | Cloud-specific agent notes |

### Intended config

```json
{
  "install": "npm ci\nnpm --prefix ud-label-system ci",
  "terminals": [
    {
      "name": "vite",
      "command": "npm run dev -- --host 0.0.0.0 --port 5173"
    }
  ]
}
```

### Environment / builds already validated by Cursor

- Environment: `b533b35d-94c2-11f1-ba66-0e7d0216e441` (personal transitional draft / override)
- Build (feature ref, smoke-tested): `bld-20260810-2e1b3af5-3e63-4cbd-a622-9a653ff2fd56`
- Build (default ref): `bld-20260810-69b4d305-4452-483d-b5be-c5a2c503271a`
- Fresh cloud agent booted from the feature build with `node_modules` + `ud-label-system/node_modules/sharp` already present
- Root `npm run build` succeeded
- `ud-label-system` validate **PASS** (303 products / 31 checks)
- Vite terminal was **not** auto-started from the draft override (override schema is install/start only); committed `terminals` applies once the repo config is used after merge / save

Dashboard Builds tab: https://cursor.com/dashboard/cloud-agents/environments/e/b533b35d-94c2-11f1-ba66-0e7d0216e441#builds

---

## Review checklist

1. **Config correctness**
   - Is `npm ci` for both packages the right install for Cloud Builds?
   - Is Vite correctly placed in `terminals` (not `install`)?
   - Any missing durable install step (fonts, sharp native deps, sync artifacts)?

2. **Safety / scope**
   - Confirm no secrets landed in `environment.json` / `AGENTS.md`
   - Confirm this PR does not touch label geometry, catalog WebPs, or glass unlock UI

3. **Local reproduce (optional but preferred)**
   ```bash
   git fetch origin cursor/cloud-agent-environment-build-928b
   git checkout cursor/cloud-agent-environment-build-928b
   rm -rf node_modules ud-label-system/node_modules
   npm ci
   npm --prefix ud-label-system ci
   npm run build
   cd ud-label-system && npm run validate
   ```
   Expect root Vite build OK and label validate PASS.

4. **Handoff recommendation**
   - Approve / request changes on PR #1
   - Note whether Benjamin should merge PR then [Enable builds](https://cursor.com/dashboard/cloud-agents/environments/e/b533b35d-94c2-11f1-ba66-0e7d0216e441#builds)
   - Call out if install should also warm anything else (for example a lightweight label sync) or stay deps-only

---

## Out of scope for this review

- Five-tap glass unlock polish (already on `main`; older notes in `CLAUDE_CODE_HANDOFF.md`)
- Full catalog vial regeneration
- Stripe / Chargebee / Vercel production changes
- Enabling Builds in the Cursor dashboard (Benjamin does that after review)

---

## Paste prompt for Claude Code

```text
Review the Cloud Agent environment Builds work on branch cursor/cloud-agent-environment-build-928b / PR https://github.com/Bphill10/wellpept.com/pull/1

Follow CLAUDE_CODE_BUILD_REVIEW.md exactly. Check .cursor/environment.json and AGENTS.md, optionally reproduce npm ci + builds, and write CURSOR_RETURN.md with approve/request-changes plus any install tweaks. Do not merge, force-push, or reopen product/UI tasks unless this PR broke them.
```
