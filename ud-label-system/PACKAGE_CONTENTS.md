# Package contents

- `START_HERE_CURSOR.md` — full setup, generation, printing, and placement instructions
- `CURSOR_HANDOFF_PROMPT.txt` — ready-to-paste task prompt for Cursor
- `.cursor/rules/ud-label-system.mdc` — always-on project rules
- `data/UD_Peptide_Label_Catalog.xlsx` — editable 303-row product source and field guide
- `templates/` — four editable, borderless SVG masters
- `assets/brand/` — latest UD brand image, mascot, and transparent render assets
- `assets/vials/` — three unlabeled black-cap stock vial images
- `assets/approved-products/` — approved TA-1, KLOW, and NAD+ website references
- `examples/generated/` — current SVG, preview, and NIIMBOT M2 one-bit proofs
- `examples/vial-mockups/` — deterministic 20/60/20 placement proofs
- `config/` — exact label, QR, printer, and vial-placement settings
- `../tools/blender-vials/` — headless Cycles studio for the four unlabeled locked vial stocks
- `blender/` — publish step plus a wrapper that calls `tools/blender-vials`
- `scripts/` — workbook sync, label generation, placement, and validation tools
- `validation-report.json` — final PASS report

Open this folder as a project in Cursor. Cursor will automatically load `.cursor/rules/ud-label-system.mdc`. Then run:

```bash
npm install
npm run build
```

Edit product data in the workbook, run `npm run sync`, and use `npm run label` to create labels. Every text area and the QR/mascot/brand-spacing controls are documented in the workbook `Field Guide` sheet and `config/label-system.json`.
