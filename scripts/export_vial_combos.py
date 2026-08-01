"""Export all Undisclosed catalog vial combos (blank plates + labeled PNGs) as a zip."""
from __future__ import annotations

import re
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
REFS = PUBLIC / "references"
OUT_DIR = ROOT / "exports" / "vial-combos"
ZIP_PATH = ROOT / "exports" / "undisclosed-vial-combos.zip"

WHITE = REFS / "vial-white-template.png"
BLUE = REFS / "vial-blue-template.png"
TEN = PUBLIC / "real-vial-10ml.jpg"
UNLABELED = REFS / "vial-unlabeled-white.png"
LABEL = REFS / "label-template.png"
COMPLETE = REFS / "vial-complete-example-klow.png"
CASE = REFS / "klow-case-kit.png"

# Catalog focus set + short label names (matches site)
PEPTIDES = [
    ("Tirzepatide", "TIRZ", "white"),
    ("Retatrutide", "RETA", "white"),
    ("Semaglutide", "SEMA", "white"),
    ("BPC-157", "BPC157", "white"),
    ("TB-500", "TB500", "white"),
    ("KLOW", "KLOW", "blue"),
    ("GLOW", "GLOW", "blue"),
    ("GHK-Cu", "GHK", "blue"),
    ("Tesamorelin", "TESA", "white"),
    ("Ipamorelin", "IPA", "white"),
    ("CJC-1295", "CJC", "white"),
    ("CJC-1295 / Ipamorelin", "CJC-IPA", "white"),  # filename-safe; label text CJC/IPA
    ("HGH", "HGH", "white"),
    ("NAD+", "NAD", "ten"),
    ("MOTS-c", "MOTS", "white"),
    ("Epithalon", "EPIT", "white"),
    ("Semax", "SEMX", "white"),
    ("Selank", "SELK", "white"),
    ("Glutathione", "GLUTA", "ten"),
    ("SS-31", "SS31", "white"),
    ("PT-141", "PT", "white"),
    ("Thymosin Alpha-1", "TA-1", "white"),
    ("KPV", "KPV", "white"),
    ("Cagrilintide", "CARGI", "white"),
    ("ARA-290", "ARA", "white"),
    ("FOX04-DRI", "FOX4", "white"),
    ("DSIP", "DSIP", "white"),
    ("Vitamin B12", "B12", "ten"),
]

LABEL_TEXT = {
    "CJC-IPA": "CJC/IPA",
}


def slug(name: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").lower()
    return s or "peptide"


def load_plate(kind: str) -> Image.Image:
    if kind == "blue":
        path = BLUE
    elif kind == "ten":
        path = TEN if TEN.exists() else WHITE
    else:
        path = WHITE
    img = Image.open(path).convert("RGBA")
    # Normalize catalog framing to 600×900 (cover)
    target = (600, 900)
    if img.size != target and kind != "ten":
        scale = max(target[0] / img.width, target[1] / img.height)
        nw, nh = int(img.width * scale), int(img.height * scale)
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", target, (0, 0, 0, 255))
        canvas.paste(img, ((target[0] - nw) // 2, (target[1] - nh) // 2))
        return canvas
    if kind == "ten":
        # Keep native aspect; pad to black square-friendly portrait
        tw, th = 600, 900
        scale = min(tw / img.width, th / img.height)
        nw, nh = int(img.width * scale), int(img.height * scale)
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 255))
        canvas.paste(img, ((tw - nw) // 2, (th - nh) // 2), img if img.mode == "RGBA" else None)
        return canvas
    return img


def font_for(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_short_name(plate: Image.Image, text: str) -> Image.Image:
    """Match site catalog overlay: name centered on blank wrap write-in panel."""
    out = plate.copy()
    draw = ImageDraw.Draw(out)
    w, h = out.size

    # Same ratios as drawExamplePlate (cover-fitted plate fills canvas)
    lx = w * 0.255
    ly = h * 0.39
    lw = w * 0.49
    lh = h * 0.30
    mid_x = lx + lw * 0.14
    mid_w = lw * 0.58
    mid_cx = mid_x + mid_w / 2
    y = ly + lh * 0.28
    max_w = mid_w * 0.96
    band_h = lh * 0.32

    base = max(14, int(lh * 0.26))
    min_px = 9
    size = base
    font = font_for(size)
    while size >= min_px:
        font = font_for(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        if tw <= max_w and th <= band_h * 1.05:
            break
        size -= 1

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = mid_cx - tw / 2
    ty = y + (band_h - th) / 2 - bbox[1]
    draw.text((x, ty), text, fill=(0, 0, 0, 255), font=font)
    return out


def copy_asset(src: Path, dest: Path) -> None:
    if not src.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.open(src).convert("RGBA").save(dest)


def main() -> None:
    if OUT_DIR.exists():
        for p in OUT_DIR.rglob("*"):
            if p.is_file():
                p.unlink()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    blanks = OUT_DIR / "00-templates"
    blanks.mkdir(exist_ok=True)
    labeled = OUT_DIR / "01-catalog-labeled"
    labeled.mkdir(exist_ok=True)

    # Raw templates for enhancement
    for src, name in [
        (WHITE, "vial-white-template.png"),
        (BLUE, "vial-blue-template.png"),
        (TEN, "vial-10ml.jpg"),
        (UNLABELED, "vial-unlabeled-white.png"),
        (LABEL, "label-template.png"),
        (COMPLETE, "vial-complete-example-klow.png"),
        (CASE, "klow-case-kit.png"),
    ]:
        if src.exists():
            dest = blanks / name
            if src.suffix.lower() in {".jpg", ".jpeg"}:
                Image.open(src).convert("RGB").save(dest.with_suffix(".jpg"), quality=95)
            else:
                Image.open(src).convert("RGBA").save(dest)

    # One labeled PNG per catalog peptide
    manifest = ["filename,full_name,short_label,plate"]
    for full, short_file, kind in PEPTIDES:
        label = LABEL_TEXT.get(short_file, short_file)
        plate = load_plate(kind)
        # Ten-ml reference photo is unlabeled — still export plate + overlay when possible
        if kind == "ten" and TEN.exists():
            # 10 mL stock may not have blank wrap; export plate alone + note
            out = plate
            # Try overlay anyway in case framing roughly matches
            try:
                out = draw_short_name(plate, label)
            except Exception:
                out = plate
        else:
            out = draw_short_name(plate, label)

        fname = f"{slug(full)}__{short_file.replace('/', '-')}__{kind}.png"
        out_path = labeled / fname
        out.convert("RGBA").save(out_path)
        manifest.append(f"{fname},{full},{label},{kind}")

    (OUT_DIR / "manifest.csv").write_text("\n".join(manifest) + "\n", encoding="utf-8")
    (OUT_DIR / "README.txt").write_text(
        "\n".join(
            [
                "Undisclosed vial combos export",
                "",
                "00-templates/  — blank plates + label + kit refs (best for enhancement)",
                "01-catalog-labeled/ — one PNG per catalog peptide with short name overlay",
                "manifest.csv — mapping of filename → full name / short / plate type",
                "",
                "Plate types:",
                "  white = 3 mL white powder blank wrap",
                "  blue  = 3 mL blue powder (KLOW / GLOW / GHK-Cu)",
                "  ten   = 10 mL (NAD+ / Glutathione / Vitamin B12)",
                "",
                "Short labels used on wraps:",
                "  TIRZ RETA SEMA BPC157 TB500 KLOW GLOW GHK TESA IPA CJC CJC/IPA",
                "  HGH NAD MOTS EPIT SEMX SELK GLUTA SS31 PT TA-1 KPV CARGI ARA FOX4 DSIP B12",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    ZIP_PATH.parent.mkdir(parents=True, exist_ok=True)
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in OUT_DIR.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(OUT_DIR).as_posix())

    print(f"OUT={OUT_DIR}")
    print(f"ZIP={ZIP_PATH}")
    print(f"files={sum(1 for p in OUT_DIR.rglob('*') if p.is_file())}")


if __name__ == "__main__":
    main()
