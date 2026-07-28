# WellPept powder chamber — Bambu P1S print kit

Simple 3-piece kit for dry peptide → serum activation. Standard serum bottles already ship with a **screw cap + dropper**; this chamber is a temporary powder pod you put on the neck, dump powder into the bottle, then put the dropper back on.

## Files

| File | What it is |
|------|------------|
| `wellpept-neck-fit-ring.stl` | **Print this first** — fit test for your bottle neck |
| `wellpept-powder-chamber.stl` | Main powder well + thin break floor + neck skirt |
| `wellpept-chamber-lid.stl` | Press-on lid with twist tab |
| `wellpept-cap-kit-plate.stl` | All three on one plate |
| `generate_stl.py` | Regenerates STLs (edit sizes at top of file) |

Units: **millimeters**. Default neck: **~18 mm** (common 30 mL / 18-410 style).

## How to use

1. Unscrew stock cap and pull out the dropper.
2. Load dry peptide into the chamber (membrane still intact). Snap lid on.
3. Press / twist chamber onto bottle neck (inner ribs grip).
4. Pierce or twist-break the thin floor (X score on top) so powder falls into the serum.
5. Shake bottle. Remove chamber. Reinsert dropper + stock cap.

Not food-grade certified — for cosmetic DIY prototyping. Wash with IPA, dry fully before powder.

## Bambu Studio (P1S) settings

- **Filament:** PETG preferred (chemical resistance) or PLA for fit tests  
- **Nozzle:** 0.4 mm  
- **Layer height:** 0.20 mm (membrane is 0.5 mm → ~2–3 layers)  
- **Walls:** 3  
- **Infill:** 20% gyroid  
- **Supports:** none (print chamber upright, lid upright, ring upright)  
- **Orient:** flat on bed as exported  
- **Brim:** optional 3 mm if corners lift  

### Fit

1. Print `wellpept-neck-fit-ring.stl` only.  
2. Try on your bottle neck.  
3. In Bambu Studio → **Scale** uniformly until snug (usually **98–103%**).  
4. Apply the same scale to chamber + lid.  

Or edit `NECK_OD` / `CLEARANCE` in `generate_stl.py` and re-run:

```bash
python3 printables/serum-cap/generate_stl.py
```

## Measure your bottle

Calipers on the **thread major diameter** (widest part of neck threads) → set as `NECK_OD`.  
If you only have a friction lip (no threads), measure that OD the same way.

## Safety / product note

This is a prototype twist-cap powder chamber for WellPept Fresh Mix packaging R&D. Thin membrane is designed to be pierced or broken by hand — not a sealed pharmaceutical closure.
