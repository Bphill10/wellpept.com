# Undisclosed etched vial flip-caps (3D print)

Snap-style plastic caps for typical **13 mm** research vial necks. Short peptide
names are recessed into the **top** and lightly raised on the **side** so they
still read after printing.

## Short names

| Peptide | Cap etch |
|---------|----------|
| Tirzepatide | TRIZ |
| Retatrutide | RETA |
| Semaglutide | SEMA |
| BPC-157 | BPC |
| TB-500 | TB5 |
| … | See calculator / `CAP_LABELS` in `generate_stl.py` |

## Downloads (site)

From the Undisclosed calculator, or direct under `/printables/`:

| File | Use |
|------|-----|
| `undisclosed-cap-reta.stl` | Single RETA cap (example) |
| `undisclosed-cap-{slug}.stl` | One cap per short name |
| `undisclosed-cap-plate.stl` | Full plate of all etched caps |
| `undisclosed-cap-blank.stl` | UD blank |

Units: **millimeters**. Cap OD ≈ **15.6 mm**, height ≈ **7.2 mm**.

## Regenerate

```bash
python3 printables/vial-caps/generate_stl.py
```

Copies into `public/printables/` for the site.

## Bambu / FDM

- **Filament:** PETG or PLA  
- **Layer height:** 0.16–0.20 mm (finer = sharper etch)  
- **Walls:** 3  
- **Infill:** 20–30%  
- **Supports:** none — print **top up** (etched face on top)  
- Scale ±1–2% if the snap is tight/loose on your vials  

Research organization only — not a certified pharmaceutical closure.
