# Undisclosed Blender vial studio

Headless Cycles studio that rebuilds the four unlabeled locked stocks from one
shared 3 mL / 10 mL scene. The two 3 mL plates share the same mesh, camera,
lights, cap, and crimp — only cake color changes.

## Plates

| Id | File | Contents |
|----|------|----------|
| 01 | `01_3mL_White_Powder_LOCKED.png` | White lyophilized cake |
| 02 | `02_3mL_Cobalt_Blue_Powder_LOCKED.png` | Cobalt-blue cake |
| 03 | `03_10mL_White_Powder_LOCKED.png` | White cake |
| 04 | `04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png` | Ruby liquid, 75% fill |

Canvas is always **1024 × 1536**, pure black, black flip-off, brushed-silver crimp.

## Render

From `ud-label-system`:

```bash
npm run vial-studio -- --preview
npm run vial-studio
npm run publish-vial-stocks
```

`render.sh` downloads Blender 4.2 LTS into `~/.local/share/undisclosed-blender`
when `blender` is not on `PATH`. Override with `BLENDER_BIN`.

Useful flags (after `--`):

```bash
bash blender/render.sh --variants 01,02 --preview
bash blender/render.sh --variants 04 --samples 128
```

## Publish

`publish-stocks.mjs` copies `blender/output/*.png` onto:

- `locked-masters/vials/`
- `assets/vials/`
- `public/ud-labels/vials/`

It also measures the straight glass body and writes `bodyBoundsPx` in
`config/vial-placement.json`. Label placement stays 20 / 60 / 20 from those
bounds — never a separate `labelBoundsPx`.

Do not put Blender render on `npm run build`. Build consumes the published
PNGs only.
