#!/usr/bin/env python3
"""
Undisclosed etched flip-caps for ~3 mL research vials (STL, mm).

Plastic snap-style cap sized for typical 13 mm vial necks. Short peptide
names are recessed into the top face (and lightly into the side band) so
they read after print — e.g. RETA, TRIZ, SEMA, BPC.

Print top-up, 0.2 mm layers, no supports. PETG or PLA.
"""
from __future__ import annotations

from pathlib import Path
import math
import struct
import shutil

OUT = Path(__file__).resolve().parent
PUBLIC = Path(__file__).resolve().parents[2] / "public" / "printables"

# --- Cap fit (13 mm research vial flip-off style) ---
CAP_OD = 15.6
CAP_ID = 13.15
WALL = (CAP_OD - CAP_ID) / 2
HEIGHT = 7.2
TOP_T = 1.6
RIM_H = 1.1
SEGS = 64
ENGRAVE_D = 0.45  # recess depth on top
SIDE_ENGRAVE_D = 0.35

# Short names to bake (must fit ≤5 glyphs)
CAP_LABELS = [
    "RETA",
    "TRIZ",
    "SEMA",
    "BPC",
    "TB5",
    "KLOW",
    "GLOW",
    "GHK",
    "TESA",
    "IPA",
    "CJC",
    "CJC+",
    "HGH",
    "NAD",
    "MOTS",
    "EPI",
    "SEMX",
    "SELK",
    "GSH",
    "SS31",
    "PT",
    "TA1",
    "KPV",
    "CAGRI",
    "ARA",
    "FOX",
    "DSIP",
    "B12",
    "UD",
]

# 5×7 uppercase bitmap font (columns left→right, rows top→bottom; 1 = ink)
_FONT: dict[str, list[str]] = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "M": ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "W": ["10001", "10001", "10001", "10001", "10101", "11011", "10001"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
    "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
}


def _n(a, b):
    x, y, z = a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]
    L = math.sqrt(x * x + y * y + z * z) or 1.0
    return (x / L, y / L, z / L)


def _sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


class Mesh:
    def __init__(self):
        self.tris = []

    def tri(self, a, b, c):
        self.tris.append((_n(_sub(b, a), _sub(c, a)), a, b, c))

    def quad(self, a, b, c, d):
        self.tri(a, b, c)
        self.tri(a, c, d)

    def box(self, x0, y0, z0, x1, y1, z1):
        p = [
            (x0, y0, z0),
            (x1, y0, z0),
            (x1, y1, z0),
            (x0, y1, z0),
            (x0, y0, z1),
            (x1, y0, z1),
            (x1, y1, z1),
            (x0, y1, z1),
        ]
        self.quad(p[0], p[1], p[2], p[3])  # bottom
        self.quad(p[4], p[7], p[6], p[5])  # top
        self.quad(p[0], p[4], p[5], p[1])
        self.quad(p[1], p[5], p[6], p[2])
        self.quad(p[2], p[6], p[7], p[3])
        self.quad(p[3], p[7], p[4], p[0])

    def write(self, path: Path, label: str = "UD cap"):
        with path.open("wb") as f:
            f.write(label.encode("ascii", "ignore")[:80].ljust(80, b"\0"))
            f.write(struct.pack("<I", len(self.tris)))
            for (nx, ny, nz), a, b, c in self.tris:
                f.write(
                    struct.pack(
                        "<12fH",
                        nx,
                        ny,
                        nz,
                        a[0],
                        a[1],
                        a[2],
                        b[0],
                        b[1],
                        b[2],
                        c[0],
                        c[1],
                        c[2],
                        0,
                    )
                )
        print(f"  {path.name:42s}  {len(self.tris):5d} tris")


def ring(r, z, n=SEGS):
    return [
        (r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), z)
        for i in range(n)
    ]


def tube(m, ro, ri, z0, z1, n=SEGS):
    o0, o1, i0, i1 = ring(ro, z0, n), ring(ro, z1, n), ring(ri, z0, n), ring(ri, z1, n)
    for i in range(n):
        j = (i + 1) % n
        m.quad(o0[i], o0[j], o1[j], o1[i])
        m.quad(i0[j], i0[i], i1[i], i1[j])


def annulus(m, ro, ri, z, up=True, n=SEGS):
    o, inn = ring(ro, z, n), ring(ri, z, n)
    for i in range(n):
        j = (i + 1) % n
        if up:
            m.quad(o[i], inn[i], inn[j], o[j])
        else:
            m.quad(o[j], inn[j], inn[i], o[i])


def disk(m, r, z, up=True, n=SEGS):
    c = (0.0, 0.0, z)
    pts = ring(r, z, n)
    for i in range(n):
        j = (i + 1) % n
        if up:
            m.tri(c, pts[i], pts[j])
        else:
            m.tri(c, pts[j], pts[i])


def etch_text_top(m: Mesh, text: str, z_top: float, max_w: float):
    """Recess bitmap glyphs into the top face (negative Z into the cap)."""
    text = text.upper()[:5]
    if not text:
        return
    cols = 5
    rows = 7
    gap = 1  # column gap between letters in font units
    units = len(text) * cols + (len(text) - 1) * gap
    cell = max_w / max(units, 1)
    # Slightly taller cells for readability on a round face
    cell_h = cell * 1.15
    total_w = units * cell
    total_h = rows * cell_h
    x0 = -total_w / 2
    y0 = total_h / 2
    depth = ENGRAVE_D
    z1 = z_top
    z0 = z_top - depth

    cursor = 0
    for ch in text:
        glyph = _FONT.get(ch, _FONT[" "])
        for r in range(rows):
            for c in range(cols):
                if glyph[r][c] != "1":
                    continue
                xa = x0 + (cursor + c) * cell
                xb = xa + cell * 0.88
                ya = y0 - (r + 1) * cell_h
                yb = ya + cell_h * 0.88
                m.box(xa, ya, z0, xb, yb, z1)
        cursor += cols + gap


def etch_text_side(m: Mesh, text: str, r_outer: float, z_mid: float):
    """Shallow outward emboss on the side band (raised letters)."""
    text = text.upper()[:5]
    if not text:
        return
    # Place glyphs along an arc on +Y facing side (flat-ish chord)
    span = math.radians(70)
    n = len(text)
    for i, ch in enumerate(text):
        t = (i + 0.5) / n - 0.5
        ang = t * span + math.pi / 2  # center on +Y
        glyph = _FONT.get(ch, _FONT[" "])
        # Local frame at cap perimeter
        cx = (r_outer - 0.15) * math.cos(ang)
        cy = (r_outer - 0.15) * math.sin(ang)
        ux, uy = math.cos(ang), math.sin(ang)  # outward
        tx, ty = -uy, ux  # tangent
        cell = 0.55
        rows, cols = 7, 5
        for r in range(rows):
            for c in range(cols):
                if glyph[r][c] != "1":
                    continue
                # glyph local coords
                lx = (c - 2) * cell
                ly = (3 - r) * cell
                # map to world on cylinder-ish plane
                px = cx + tx * lx
                py = cy + ty * lx
                pz0 = z_mid + ly - cell * 0.1
                pz1 = z_mid + ly + cell * 0.75
                # thin outward brick
                ox, oy = ux * SIDE_ENGRAVE_D, uy * SIDE_ENGRAVE_D
                a = (px, py, pz0)
                b = (px + tx * cell * 0.8, py + ty * cell * 0.8, pz0)
                cpt = (px + tx * cell * 0.8 + ox, py + ty * cell * 0.8 + oy, pz0)
                d = (px + ox, py + oy, pz0)
                a2 = (px, py, pz1)
                b2 = (px + tx * cell * 0.8, py + ty * cell * 0.8, pz1)
                c2 = (px + tx * cell * 0.8 + ox, py + ty * cell * 0.8 + oy, pz1)
                d2 = (px + ox, py + oy, pz1)
                m.quad(a, b, b2, a2)
                m.quad(b, cpt, c2, b2)
                m.quad(cpt, d, d2, c2)
                m.quad(d, a, a2, d2)
                m.quad(a2, b2, c2, d2)


def make_cap(label: str) -> Mesh:
    m = Mesh()
    ro = CAP_OD / 2
    ri = CAP_ID / 2
    z_skirt = HEIGHT - TOP_T

    # Skirt wall
    tube(m, ro, ri, 0, z_skirt)
    annulus(m, ro, ri, 0, up=False)

    # Inner snap lip (small undercut ring)
    lip_h = 0.7
    lip_in = 0.35
    tube(m, ri, ri - lip_in, RIM_H, RIM_H + lip_h)
    annulus(m, ri, ri - lip_in, RIM_H, up=False)
    annulus(m, ri, ri - lip_in, RIM_H + lip_h, up=True)

    # Top disk
    z0, z1 = z_skirt, HEIGHT
    o0, o1 = ring(ro, z0), ring(ro, z1)
    for i in range(SEGS):
        j = (i + 1) % SEGS
        m.quad(o0[i], o0[j], o1[j], o1[i])
    disk(m, ro, z1, up=True)
    annulus(m, ro, ri, z0, up=False)

    # Recessed etch on top
    etch_text_top(m, label, z1, max_w=ro * 1.55)
    # Side etch on skirt
    etch_text_side(m, label, ro, z_mid=z_skirt * 0.55)

    # Tiny UD tick opposite the side text (−Y) for orientation
    tick_w, tick_d, tick_h = 1.2, 0.4, 0.5
    m.box(-tick_w / 2, -ro, z_skirt * 0.35, tick_w / 2, -ro + tick_d, z_skirt * 0.35 + tick_h)

    return m


def translate(src: Mesh, dx, dy, dz=0.0) -> Mesh:
    out = Mesh()
    for nrm, a, b, c in src.tris:

        def t(p):
            return (p[0] + dx, p[1] + dy, p[2] + dz)

        out.tris.append((nrm, t(a), t(b), t(c)))
    return out


def merge(*meshes: Mesh) -> Mesh:
    out = Mesh()
    for m in meshes:
        out.tris.extend(m.tris)
    return out


def slug(label: str) -> str:
    return (
        label.lower()
        .replace("+", "plus")
        .replace(" ", "")
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    plate_parts = []
    cols = 7
    pitch = CAP_OD + 3.0
    for idx, label in enumerate(CAP_LABELS):
        cap = make_cap(label)
        name = f"undisclosed-cap-{slug(label)}.stl"
        path = OUT / name
        cap.write(path, label=f"UD cap {label}")
        shutil.copy2(path, PUBLIC / name)
        row, col = divmod(idx, cols)
        plate_parts.append(
            translate(cap, (col - (cols - 1) / 2) * pitch, -(row) * pitch)
        )

    plate = merge(*plate_parts)
    plate_name = "undisclosed-cap-plate.stl"
    plate.write(OUT / plate_name, label="UD cap plate")
    shutil.copy2(OUT / plate_name, PUBLIC / plate_name)

    # Blank (UD) already included; also emit a generic blank alias
    blank = make_cap("UD")
    blank.write(OUT / "undisclosed-cap-blank.stl", label="UD cap blank")
    shutil.copy2(OUT / "undisclosed-cap-blank.stl", PUBLIC / "undisclosed-cap-blank.stl")

    print(f"Done → {OUT} and {PUBLIC} ({len(CAP_LABELS)} caps + plate)")


if __name__ == "__main__":
    main()
