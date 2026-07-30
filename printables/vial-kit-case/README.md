# Undisclosed 10-vial kit case (3D print)

Printable case matching the clear hinged research kit in the product photo:

- **2×5** pockets for standard ~3 mL lyophilized vials  
- Side trough for spare flip-off caps  
- Hinged lid with snap latch  
- Inner lid frame for a wrap label  

## Download (site)

From the Undisclosed calculator page, or direct:

| File | Use |
|------|-----|
| [`undisclosed-vial-case-plate.stl`](/printables/undisclosed-vial-case-plate.stl) | **Print this** — base + lid + pin on one plate |
| [`undisclosed-vial-case-base.stl`](/printables/undisclosed-vial-case-base.stl) | Base only |
| [`undisclosed-vial-case-lid.stl`](/printables/undisclosed-vial-case-lid.stl) | Lid only |
| [`undisclosed-vial-case-pin.stl`](/printables/undisclosed-vial-case-pin.stl) | Hinge pin (or use 3 mm filament / wire) |

Units: **millimeters**.

## Default size

- Outer footprint ≈ **141 × 50 mm**  
- Vial pockets ≈ **20 × 20 × 22 mm**  
- Cap trough ≈ **24 mm** wide  

Edit sizes at the top of `generate_stl.py` and re-run:

```bash
python3 printables/vial-kit-case/generate_stl.py
```

## Bambu / FDM settings

- **Filament:** PETG (tougher latch/hinge) or PLA  
- **Nozzle:** 0.4 mm  
- **Layer height:** 0.20 mm  
- **Walls:** 3–4  
- **Infill:** 15–20% gyroid  
- **Supports:** none (print flat as exported)  
- **Brim:** optional 3 mm  

### Assembly

1. Print the plate (or base + lid separately).  
2. Align lid knuckles between base knuckles.  
3. Slide pin / 3 mm filament through the hinge.  
4. Snap front latch closed.  

Scale ±1–3% in the slicer if your vials are tighter/looser.

## Note

Prototype packaging for lab organization — not a certified pharmaceutical shipper. Hard-refresh the site after deploy if STL downloads are cached.
