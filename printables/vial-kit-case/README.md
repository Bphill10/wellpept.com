# Undisclosed clear 10-vial kit case (3D print)

Matches the **clear hinged case** in the featured KLOW kit photo on the shop:

- **2×5** snug rectangular pockets for ~3 mL lyophilized vials  
- **4 round spare-cap wells** in a right-hand column (like the blue KLOW caps in the photo)  
- Thin walls for **clear PETG / clear PLA**  
- Hinged lid with snap latch + large inner frame for a wrap label  

## Download (site)

Free Prints / calculator, or direct:

| File | Use |
|------|-----|
| [`undisclosed-vial-case-plate.stl`](/printables/undisclosed-vial-case-plate.stl) | **Print this** — base + lid + pin |
| [`undisclosed-vial-case-base.stl`](/printables/undisclosed-vial-case-base.stl) | Base only |
| [`undisclosed-vial-case-lid.stl`](/printables/undisclosed-vial-case-lid.stl) | Lid only |
| [`undisclosed-vial-case-pin.stl`](/printables/undisclosed-vial-case-pin.stl) | Hinge pin (or 3 mm filament / wire) |

Units: **millimeters**.

## Default size

- Outer footprint ≈ **128 × 46 mm** (regen prints exact)  
- Vial pockets ≈ **18.5 × 18.5 × 20 mm**  
- Cap wells ≈ **14.2 mm** ID × 4  

```bash
python3 printables/vial-kit-case/generate_stl.py
```

## Clear filament (recommended)

You already have clear filament — use it for the KLOW look.

| Setting | Value |
|---------|--------|
| **Filament** | Clear PETG (tougher latch) or clear PLA |
| **Nozzle** | 0.4 mm |
| **Layer height** | 0.16–0.20 mm |
| **Walls** | 2–3 (fewer = clearer) |
| **Infill** | 0–15% gyroid / lightning |
| **Supports** | None — print flat as exported |
| **Speed** | Slow outer walls (~25–40 mm/s) for clarity |
| **Temp** | Dry filament first; follow brand clear profile |
| **Ironing** | Optional on lid top for smoother label face |

### Assembly

1. Print the plate (or base + lid separately).  
2. Align lid knuckles between base knuckles.  
3. Slide pin / 3 mm clear filament through the hinge.  
4. Snap front latch closed.  
5. Affix the kit wrap label inside the lid frame.  

Scale ±1–3% if vials are tight/loose.

## Note

Prototype packaging for lab organization — not a certified pharmaceutical shipper. Hard-refresh after deploy if STL downloads are cached.
