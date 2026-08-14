# Undisclosed branded vial display rack (3D print)

Desktop holder for ~3 mL research vials with an embossed **UNDISCLOSED**
backboard. Vials drop into snug **17.4 mm** collars and rest on a thin floor
plate, so labels stay readable above the rim. Companion to the etched
[vial caps](../vial-caps/README.md) and the [clear kit case](../vial-kit-case/README.md).

## Variants

| File | Layout | Footprint (W × D × H) |
|------|--------|-----------------------|
| `undisclosed-vial-rack.stl` | 1×6 single-row display | ~158 × 41 × 37 mm |
| `undisclosed-vial-rack-10.stl` | 2×5 **stepped riser** (back row raised so both rows' labels show) | ~133 × 67 × 37 mm |
| `undisclosed-vial-rack-mini.stl` | 1×3 travel rack (`UD` board) | ~83 × 41 × 37 mm |

Units: **millimeters**. Preview image lives in `/printables/previews/rack-thumb.svg`.

## Downloads (site)

**Free prints** page in Undisclosed (header → Free prints), the calculator
print panel, or direct under `/printables/`.

## Regenerate

```bash
python3 printables/vial-rack/generate_stl.py
```

Copies each STL into `public/printables/` for the site. Edit the sizes at the
top of the script (`WELL_ID`, `WELL_H`, `GAP_X`, `STEP_H`, …) to retune.

## Bambu / FDM

- **Filament:** PETG or PLA
- **Layer height:** 0.20 mm (0.16 mm for a crisper wordmark)
- **Walls:** 3
- **Infill:** 15–25%
- **Supports:** **none** — the collars and backboard are vertical; print flat
  as exported (raised letters are a ~0.7 mm horizontal proud, bridges cleanly)
- **Orient:** floor plate on the bed, backboard standing up
- Scale ±1–2% if vials sit tight or loose in the collars

Research-organization display stand only — not a certified pharmaceutical
closure or shipper. Hard-refresh after deploy if an STL download is cached.
