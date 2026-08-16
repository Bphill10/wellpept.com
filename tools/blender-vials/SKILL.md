---
name: blender-vials
description: Headless Blender / Cycles studio for Undisclosed unlabeled vial stocks. Use when the user says blender, belnder, vial studio, redo locked stocks, or /tools/blender-vials.
---

# Blender vial stocks

Canonical tool: `tools/blender-vials/`.

```
tools/blender-vials/
  references/   image-gen look targets (1122×1402)
  renders/      Cycles working output (gitignored)
  masters/      approved 1024×1536 plates
  scripts/      render + publish
```

Rebuilds unlabeled stock plates from shared scenes. The two 3 mL plates
are twins — same mesh, camera, lights, cap, and crimp. Only cake color
changes.

## Plates

| Id | Reference | Master | Contents |
|----|-----------|--------|----------|
| 01 | `image-gen-3ml White.png` | `01_3mL_White_Powder_LOCKED.png` | White cake |
| 02 | `image-gen-3ml Blue.png` | `02_3mL_Cobalt_Blue_Powder_LOCKED.png` | Cobalt-blue cake |
| 03 | `image-gen-10ml White.png` | `03_10mL_White_Powder_LOCKED.png` | White cake |
| 04 | `image-gen-10ml Red.png` | `04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png` | Ruby liquid, 75% fill |
| 05 | `image-gen-5ml White.png` | `05_5mL_White_Powder_LOCKED.png` | White cake (studio only) |

`plates.json` is the machine-readable map. Production masters stay
**1024 × 1536**, pure black, black flip-off, brushed-silver crimp.

## Rules

- Do not replace locked masters until Benjamin approves the look.
- Compare new plates to `tools/blender-vials/references/` first.
- Promote approved finals into `masters/`. Publish reads that folder only.
- Label placement stays 20 / 60 / 20 from measured `bodyBoundsPx`. Never add `labelBoundsPx`.
- Both 3 mL stocks must stay geometrically identical except cake color.
- B12 is a native liquid volume. Never recolor a powder cake to fake liquid.
- Do not put Blender render on `npm run build`.
- Do not run a full 303 catalog regen unless asked. Proof RETA / KLOW / B12 first.
- Do not publish 5 mL until a `5ML` placement profile exists.

## Commands

From repo root:

```bash
bash tools/blender-vials/scripts/render.sh --preview
bash tools/blender-vials/scripts/render.sh --variants 01,02 --preview
bash tools/blender-vials/scripts/render.sh --variants 05 --preview
bash tools/blender-vials/scripts/render.sh
```

From `ud-label-system` (same tool):

```bash
npm run vial-studio -- --preview
npm run vial-studio
npm run publish-vial-stocks
```

`scripts/render.sh` downloads Blender 4.2 LTS when `blender` is not on `PATH`.
Override with `BLENDER_BIN`. Working frames land in `renders/`.

`scripts/publish-stocks.mjs` copies `masters/*.png` onto locked masters,
`assets/vials/`, and `public/ud-labels/vials/`, then writes `bodyBoundsPx`
and `ud-label-system/blender/PUBLISHED.json`.

Until that publish file exists, `npm run build` keeps the legacy cobalt
neutralize + B12 paint path.

## After a lighting change

1. Preview all five variants into `renders/`.
2. Compare against `references/`.
3. Copy approved 1024×1536 plates into `masters/`.
4. Only then run `npm run publish-vial-stocks`.
5. Run `npm run build` in `ud-label-system` and require `validation-report.json` = `PASS`.
