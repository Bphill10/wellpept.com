# Undisclosed label and vial system

This folder is the complete source of truth for Undisclosed peptide labels and website vial images. It supports more than 300 product/strength combinations, both physical label sizes, catalog and calculator layouts, MG and IU products, replaceable QR codes, the latest UD brand mark, and the UD Sentinel mascot.

## Read order

1. `.cursor/rules/ud-label-system.mdc`
2. `data/UD_Peptide_Label_Catalog.xlsx`
3. `config/label-system.json`
4. `config/vial-placement.json`
5. `templates/`
6. `assets/approved-products/`

## Non-negotiable design locks

- White label with black-only ink. Never invert it to a black label.
- No printed border around the label perimeter.
- The left brand rail is solid black and reaches the physical paper edge. No white sliver may appear after it.
- Use `assets/brand/UD_Brand_Mark_Latest_Original.png` as the authoritative new brand image.
- Use `assets/brand/UD_Sentinel_Mascot_Original.png` as the authoritative mascot.
- The templates already embed clean transparent production derivatives of both approved assets. Keep the supplied originals unchanged; do not redraw, substitute, add a background box, or change proportions.
- The mascot appears behind and above the QR box, as though it is popping out. It is proportionally larger on 50×30 mm labels.
- Keep the right QR panel and its three legal lines consistent on all four templates.
- Keep one character-space between the vertical company name and brand mark by default. `BRAND_GAP_CHARS` may be changed from 0 through 4.
- Replace `data-field` content only. Never move the locked geometry.

## Editable text and controls

Every editable area is listed in `config/label-system.json` and the workbook's `Field Guide` sheet:

- Company name and centered header company name
- Peptide display name
- Amount and unit: MG, MCG, G, IU, or ML
- Form text and Fahrenheit storage temperature
- Diluent, concentration, dose range, and dose units
- Three right-panel legal lines
- QR value and QR on/off
- Mascot on/off
- Brand/company spacing

HGH, HCG, HMG, EPO, and similar unit-based products use `IU`, not `MG`.

## Workbook workflow

`data/UD_Peptide_Label_Catalog.xlsx` is the editable source. It contains:

- `Product Catalog`: 303 product/strength rows and every label field
- `Text Defaults`: shared wording and toggles
- `Vial Placement`: exact geometry for all three stock vial images
- `Calculator Reference`: supplied per-vial diluent and concentration data
- `Field Guide`: exact SVG field map

After editing the workbook:

```bash
npm install
npm run sync
```

This refreshes `data/catalog.json` and `data/catalog.csv`. Never hand-edit generated JSON instead of the workbook unless the user explicitly asks for a one-off test.

## Generate a label

```bash
npm run label -- --name KLOW --amount 80
npm run label -- --name HGH --amount 24
npm run label -- --id UD-0001
```

Create a calculator label or override any text field:

```bash
npm run label -- --name KLOW --amount 80 --type CALCULATOR \
  --set DILUENT="3.2 mL" \
  --set CONCENTRATION="25 mg/mL" \
  --set DOSE_RANGE="2.5–5 mg" \
  --set DOSE_UNITS="10–20 u" \
  --set QR_VALUE="https://example.com/product/klow"
```

The generator automatically chooses 40×20 mm for 3 mL and 50×30 mm for 10 mL unless a size is explicitly supplied.

## NIIMBOT M2 output

- 40×20 mm: exactly 472×236 pixels
- 50×30 mm: exactly 591×354 pixels
- 300 DPI
- one-bit black/white
- no scaling, fit-to-page, enhancement, or added outline in NIIMBOT

Use the file ending `_M2_300dpi_1bit.png` for printing. Print one calibration label before a batch.

## Place a label on a vial

The physical label sits only on the straight body below the neck:

- 20% clear glass above
- 60% label
- 20% clear glass below

Generate the label first, then run:

```bash
npm run place -- \
  --profile 3ML_BLUE \
  --label examples/generated/KLOW_80MG_Catalog_40x20_Preview.png \
  --output output/vials/KLOW_80MG_3mL_Blue.png
```

Available profiles are `3ML_WHITE`, `3ML_BLUE`, and `10ML_WHITE`. The script clips every edge cleanly and prevents the uneven bottom-right paper sliver that was rejected during approval.

## Approved visual controls

- `assets/approved-products/TA1_5mg_3mL_White_BlackCap_Website_Final.png`
- `assets/approved-products/KLOW_80mg_3mL_Blue_BlackCap_Website.png`
- `assets/approved-products/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png`

Use these to judge cap shape, crimp color, label height, label placement, trim, background, glass highlights, and overall catalog finish.

Deterministic placement proofs created by the included script are in `examples/vial-mockups/`. The three unlabeled stock vials are in `assets/vials/`; the two 3 mL files share identical vial geometry and differ only in peptide-cake color.

The four current KLOW label layouts can be reviewed together at `examples/generated/ALL_4_KLOW_LABELS_CURSOR_READY.png`.

## Build and verify everything

```bash
npm run build
```

The build syncs the workbook, generates all four template examples, verifies both NIIMBOT pixel sizes, confirms the latest brand/mascot references, checks the 20/60/20 placement rule, and writes `validation-report.json`.

The included research-use wording is editable packaging text, not a legal determination. Regulatory language should be independently reviewed for the actual catalog and jurisdiction.
