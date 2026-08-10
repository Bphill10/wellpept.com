# Claude Code handoff — WellPept / Undisclosed

**Owner:** Benjamin  
**Repo:** `C:\Users\bphil\Documents\wellpept.com`  
**Last good published commit:** `31fad72` (`Publish tap-origin glass unlock, ruby B12 vials, and calculator wrap fixes.`) on `main` → https://www.wellpept.com/  
**Current review (Cloud Builds):** follow `CLAUDE_CODE_BUILD_REVIEW.md` / PR https://github.com/Bphill10/wellpept.com/pull/1  
**Cursor agent transcript (context):** `4af422d7-8d47-4ce4-84b0-d4ff9c16d008`  
**After you finish:** leave a short `CURSOR_RETURN.md` with what you changed, what still needs Cursor, and any commands run. Do not force-push. Do not commit unless Benjamin asks.

---

## Mission

Polish / finish the current unfinished work. Do **not** invent a new label renderer or “clarity” pipeline. Hand back to Cursor when done.

Primary open work:

1. **Five-tap glass transition** — phone-screen shatter must start **exactly where the user taps** (brand logo, 5th tap), then shards fall away into Undisclosed.
2. **Protect locked catalog vial art** — OpenAI / locked-master placement only.
3. **Keep B12 as ruby red liquid** on `10ML_B12_LIQUID`.
4. **Calculator vial** — unlabeled low-cake plate + clean wrap hem (no triangular flap).

---

## HARD RULES (do not violate)

### Catalog / labels (OpenAI locked system)

Read first:

- `ud-label-system/CURSOR_HANDOFF_PROMPT.txt`
- `ud-label-system/UNDISCLOSED_START_OVER.md`
- `.cursor/rules/ud-label-system.mdc`
- `ud-label-system/locked-masters/` (references + vial stock)

Locked rules:

- Source of truth: `ud-label-system/data/UD_Peptide_Label_Catalog.xlsx` → `npm run sync` (inside `ud-label-system`).
- Website vials: **1024×1536**, transparent OK.
- Label placement: **20% glass / 60% label / 20% glass** from each profile’s `bodyBoundsPx`. Never invent a separate hard-coded `labelBoundsPx`.
- **Never stretch** flat 40×20 / 50×30 print SVGs across website vials.
- **Never** “clarity” contain/crop/aspect-fit remount that shortens the wrap or clips QR/legal.
- Display on site: `object-fit: contain`, aspect 2:3. No CSS stretch/skew over catalog WebPs.
- Reference look: `ud-label-system/locked-masters/reference/3mL_Labeled_Website_Reference.png` (and 10 mL reference).
- Cobalt cake only for KLOW / GLOW / GHK-Cu / AHK-Cu unless workbook overrides.
- B12 10 mL = **ruby red liquid** via profile `10ML_B12_LIQUID`, asset `locked-masters/vials/04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png`.
- QR priority: COA URL → QR override → `https://www.wellpept.com`.
- Verify with `npm run build` in `ud-label-system`; `validation-report.json` must say `PASS`.

### What already went wrong (do not repeat)

A “make text clearer” pass changed placement to aspect-preserving contain/crop. Labels looked wrong (short band, clipped text like `LYOPHILIZED POWD`, missing QR/legal). A full `npm run website-vials` (~303) was started and **killed at ~200/303**. Catalog tree was **restored from `b94c2bf`**. Only B12 WebPs were regenerated afterward on the locked path.

**Do not re-run a full clarity regen.** Targeted regen only when a specific product/profile is wrong.

---

## Current uncommitted work (local, vs `b94c2bf`)

| Path | Intent |
|------|--------|
| `src/App.jsx` | Capture 5th brand-tap `clientX/Y` → `%` → pass `impact` into overlay |
| `src/components/ChannelTuneOverlay.jsx` | Glass shatter; CSS vars `--glass-ox` / `--glass-oy`; crack SVG shifted to tap |
| `src/index.css` | Impact core / shockwave / flash / splinters / vignette use tap origin |
| `src/utils/vialArt.js` | Calculator: `vial-unlabeled-white.png` plate; flat wrap bottom (no flap) |
| `ud-label-system/scripts/sync-workbook.mjs` | B12 10 mL → `10ML_B12_LIQUID` (not forced `10ML_WHITE`) |
| `public/ud-labels/catalog/UD_0037_*.webp` | Regenerated ruby B12 |
| `public/ud-labels/catalog/UD_0295_*.webp` | Regenerated ruby B12 |

Ignore huge untracked noise unless asked: `payload/`, `tmp-*`, CSV/XLSX dumps, extra UD catalog WebPs under `payload/public/…`.

---

## Task 1 — Phone glass shatter (highest priority)

**Desired feel:** tapping the WellPept brand 5 times cracks the **real phone screen at the fingertip**, spider cracks radiate out, then panes/shards fall away and Undisclosed is underneath.

Already wired:

- `handleBrandActivate` stores impact `%` on 5th tap.
- Overlay sets `--glass-ox` / `--glass-oy`.
- Crack art authored around viewBox `(50,43)` is translated to the tap.
- Audio = ice/glass crack (no bird-chirp pitched beeps).

Likely still needs polish (your job if it doesn’t feel like a phone shatter):

- Stronger **impact bloom at tap** before full fracture.
- Cracks should **begin at tap** and race outward (timing / denser near-field spider).
- Shards should **pivot/fly from tap**, not feel center-screen.
- Keep reduced-motion path instant and safe.
- Do not bring back the old TV-rift / phone-fault meltdown as the default (legacy markup still sits dead after the live return in `ChannelTuneOverlay.jsx` — safe to delete if you clean up).

Key files:

- `src/components/ChannelTuneOverlay.jsx`
- `src/App.jsx` (`handleBrandActivate`, `channelTuneImpact`, `<ChannelTuneOverlay impact={…} />`)
- `src/index.css` (search `glass-transition`, `glass-impact`, `glass-crack`, `glass-piece`, `glass-splinter`)

---

## Task 2 — Catalog vials (only if broken)

Renderer:

- `ud-label-system/scripts/generate-catalog-vials.mjs`
- `ud-label-system/scripts/render-locked-label.mjs`
- `ud-label-system/config/vial-placement.json`
- `ud-label-system/scripts/render-vial-contents.mjs` (B12 liquid shader — do not recolor powder cake)

Site mapping:

- `src/data/udLabelAssets.js`
- `src/data/udCatalogVialManifest.json`
- `public/ud-labels/catalog/*.webp`

Commands (from `ud-label-system`):

```bash
npm run sync
node scripts/generate-catalog-vials.mjs --id UD-0037 --id UD-0295   # targeted only
npm run build   # must PASS validation-report.json
```

Full catalog only if Benjamin explicitly asks:

```bash
npm run website-vials
```

Proof products: RETA 10 MG 3 mL (white cake), B12 10 MG 10 mL (ruby liquid), one cobalt (e.g. KLOW/GLOW).

---

## Task 3 — Calculator wrap

- Catalog cards: blank wrap photos in `public/references/` + short name only (existing rule).
- Live calculator: unlabeled glass `public/references/vial-unlabeled-white.png` + live wrap via `paintLabelTemplate` / `drawCatalogWrapOnVial` in `src/utils/vialArt.js`.
- Do **not** stack a second live QR on blank-wrap catalog photos.
- Keep the snip: **flat bottom hem**, no white triangular flap under the wrap.

---

## Site / product notes (don’t regress)

- Terminology: prefer clear / cobalt / ruby vial wording; avoid “white powder” in UI copy.
- Atlas = Sentinel nickname in knowledge console (`SentinelKnowledgeChat.jsx`).
- Unlock ritual: 5 taps on header brand while locked on skincare → glass transition → Undisclosed catalog.
- Direct `vercel --prod` may fail auth; publishing has been via **git push to `main`** (only when Benjamin asks).

---

## Suggested Claude Code workflow

1. Read this file + the three locked-label docs above.
2. `git status` / `git diff` the listed paths; do not touch unrelated untracked junk.
3. Fix / polish the **glass shatter** first; verify with 5 taps on brand (desktop + phone if possible).
4. Spot-check RETA / B12 / cobalt catalog cards; regenerate **only** broken IDs with locked scripts.
5. Spot-check calculator wrap (hem + cake height).
6. Write `CURSOR_RETURN.md` summarizing:
   - files changed
   - before/after behavior
   - commands run + pass/fail
   - anything Cursor should publish or re-check
7. Stop. Do not open a PR or push unless Benjamin asks.

---

## Paste prompt for Claude Code

```text
Open C:\Users\bphil\Documents\wellpept.com and follow CLAUDE_CODE_HANDOFF.md exactly.

Goal: polish the five-tap phone-glass shatter so fracture begins at the tap point, keep locked OpenAI catalog vial placement (no clarity contain/crop), keep B12 ruby liquid, keep calculator unlabeled plate + flat wrap hem.

Do not redesign the site. Do not full-regen all catalog vials unless I ask. Do not commit/push unless I ask. When done, write CURSOR_RETURN.md for handoff back to Cursor.
```

---

## Hand back to Cursor

When Benjamin returns here, Cursor should:

1. Read `CURSOR_RETURN.md`.
2. Diff your changes against this handoff.
3. Publish only if Benjamin asks (prefer git push to `main` over direct Vercel CLI).
