---
name: blender-vials
description: Headless Blender / Cycles studio for Undisclosed unlabeled vial stocks. Use when the user says blender, belnder, vial studio, redo locked stocks, or /tools/blender-vials.
---

# Blender vial stocks

Canonical tool: `tools/blender-vials/`.

```
tools/blender-vials/
  references/   current locked plates (symlinks)
  renders/      Cycles output (gitignored)
  scripts/      render + publish
```

Rebuilds the four unlabeled locked plates from one 3 mL scene and one 10 mL
scene. The two 3 mL plates are twins — same mesh, camera, lights, cap, and
crimp. Only cake color changes.

## Plates

| Id | File | Contents |
|----|------|----------|
| 01 | `01_3mL_White_Powder_LOCKED.png` | White lyophilized cake |
| 02 | `02_3mL_Cobalt_Blue_Powder_LOCKED.png` | Cobalt-blue cake |
| 03 | `03_10mL_White_Powder_LOCKED.png` | White cake |
| 04 | `04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png` | Ruby liquid, 75% fill |

Canvas is always **1024 × 1536**, pure black, black flip-off, brushed-silver crimp.

## Rules

- Do not replace locked masters until Benjamin approves the look.
- Compare new plates to `tools/blender-vials/references/` first.
- Label placement stays 20 / 60 / 20 from measured `bodyBoundsPx`. Never add `labelBoundsPx`.
- Both 3 mL stocks must stay geometrically identical except cake color.
- B12 is a native liquid volume. Never recolor a powder cake to fake liquid.
- Do not put Blender render on `npm run build`.
- Do not run a full 303 catalog regen unless asked. Proof RETA / KLOW / B12 first.

## Commands

From repo root:

```bash
bash tools/blender-vials/scripts/render.sh --preview
bash tools/blender-vials/scripts/render.sh --variants 01,02 --preview
bash tools/blender-vials/scripts/render.sh
```

From `ud-label-system` (same tool):

```bash
npm run vial-studio -- --preview
npm run vial-studio
npm run publish-vial-stocks
```

`scripts/render.sh` downloads Blender 4.2 LTS when `blender` is not on `PATH`.
Override with `BLENDER_BIN`. Renders land in `renders/`.

`scripts/publish-stocks.mjs` copies `renders/*.png` onto locked masters,
`assets/vials/`, and `public/ud-labels/vials/`, then writes `bodyBoundsPx`
and `ud-label-system/blender/PUBLISHED.json`.

Until that publish file exists, `npm run build` keeps the legacy cobalt
neutralize + B12 paint path.

## After a lighting change

1. Preview all four variants into `renders/`.
2. Compare against `references/`.
3. Only then run `npm run publish-vial-stocks`.
4. Run `npm run build` in `ud-label-system` and require `validation-report.json` = `PASS`.
