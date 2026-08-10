# WellPept agent notes

## Cursor Cloud specific instructions

Cloud Agents should treat this repo as a Vite React site plus the Undisclosed label package under `ud-label-system/`.

### Environment Builds

- Config: `.cursor/environment.json`
- `install` runs `npm ci` at repo root, then `npm ci` in `ud-label-system`
- `terminals.vite` starts `npm run dev -- --host 0.0.0.0 --port 5173`
- Do not put long-running servers in `install`; they belong in `terminals` / `start`
- After merging environment config changes, prefer starting agents from an enabled Build so deps are already present

### Running / testing the site

- No `lint` or `test` scripts exist. The root checks are `npm run build` (Vite) and, for label/catalog work, `ud-label-system`'s `npm run build`.
- Dev server: `npm run dev` serves on `http://127.0.0.1:5173` (host/port are pinned in `vite.config.js`). `/api/*` routes run via the Vite `paymentsLocalApiPlugin`, mirroring the Vercel serverless functions.
- The site works without any secrets (Stripe/Chargebee/Resend/Crisp): payment + email endpoints return `enabled:false` and the UI degrades gracefully.
- The whole site is gated by an age gate + account gate. To get past it in dev without email configured: create an account, then on the "Confirm your email" screen click **Copy confirmation link** and open that `?confirm_email=...` URL (a `mailto:` app-chooser prompt may pop up first — cancel it). Accounts/sessions live in browser `localStorage` (`wellpept_*` keys); clear them to restart the flow.

### Verify before finishing label/catalog work

```bash
cd ud-label-system
npm run build   # validation-report.json must say PASS
```

Root site check:

```bash
npm run build
```

### Locked label rules

Follow `.cursor/rules/ud-label-system.mdc` and `ud-label-system/START_HERE_CURSOR.md`. Source of truth is `ud-label-system/data/UD_Peptide_Label_Catalog.xlsx`. Do not invent placement geometry or full-regen catalog vials unless explicitly asked.
