#!/usr/bin/env python3
"""
Undisclosed branded vial display rack — STL generator (mm).

A desktop holder for ~3 mL research vials with an embossed UNDISCLOSED
backboard. Vials drop into snug collars standing on a thin floor plate
(same watertight "wells on a plate" approach as the kit case — no CSG).

Variants:
  • undisclosed-vial-rack.stl       — 1×6 single-row display, UNDISCLOSED board
  • undisclosed-vial-rack-10.stl    — 2×5 stepped riser (back row raised so
                                      both rows' labels stay readable)
  • undisclosed-vial-rack-mini.stl  — 1×3 travel rack, UD board

Print flat on the bed as exported. Backboard and collars are vertical, so
no supports are needed. PETG or PLA, 0.2 mm layers, 3 walls.
"""
from __future__ import annotations

from pathlib import Path
import math
import struct

OUT = Path(__file__).resolve().parent
PUBLIC = Path(__file__).resolve().parents[2] / "public" / "printables"

# --- Vial fit (~3 mL lyophilized research vial ≈ 15–17 mm OD) ---
WELL_ID = 17.4          # bore that the vial body drops into (clearance included)
WELL_WALL = 2.2         # collar wall thickness
WELL_OD = WELL_ID + 2 * WELL_WALL
WELL_H = 15.0           # collar height (holds the lower third; label shows above)
FLOOR = 2.6             # floor-plate thickness

GAP_X = 3.0             # gap between collars along a row
GAP_Y = 4.0             # gap between rows
PITCH_X = WELL_OD + GAP_X
PITCH_Y = WELL_OD + GAP_Y

MARGIN = 6.0            # slab margin around the wells
STEP_H = 10.0           # back-row riser height (stepped variants)

BACK_T = 4.0            # backboard thickness
BACK_GAP = 3.0          # gap between last row and backboard
BACK_TOP = FLOOR + WELL_H + 19.0   # backboard top (above the collars)
EMBOSS_PROUD = 0.7      # raised letter height off the board face

SEGS = 48


# --- 5×7 uppercase bitmap font (shared look with the etched caps) ---
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
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
}


def _n(a, b):
    x = a[1] * b[2] - a[2] * b[1]
    y = a[2] * b[0] - a[0] * b[2]
    z = a[0] * b[1] - a[1] * b[0]
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

    def extend(self, other: "Mesh", dx=0.0, dy=0.0, dz=0.0):
        for nrm, a, b, c in other.tris:
            self.tris.append(
                (
                    nrm,
                    (a[0] + dx, a[1] + dy, a[2] + dz),
                    (b[0] + dx, b[1] + dy, b[2] + dz),
                    (c[0] + dx, c[1] + dy, c[2] + dz),
                )
            )

    def write(self, path: Path, label: str = "Undisclosed vial rack"):
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as f:
            f.write(label.encode("ascii", "ignore")[:80].ljust(80, b"\0"))
            f.write(struct.pack("<I", len(self.tris)))
            for (nx, ny, nz), a, b, c in self.tris:
                f.write(
                    struct.pack(
                        "<12fH",
                        nx, ny, nz,
                        a[0], a[1], a[2],
                        b[0], b[1], b[2],
                        c[0], c[1], c[2],
                        0,
                    )
                )
        print(f"  {path.name:34s}  {len(self.tris):6d} tris")


def box(m: Mesh, x0, y0, z0, x1, y1, z1):
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    if z1 < z0:
        z0, z1 = z1, z0
    p = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    ]
    m.quad(p[0], p[3], p[2], p[1])
    m.quad(p[4], p[5], p[6], p[7])
    m.quad(p[0], p[1], p[5], p[4])
    m.quad(p[1], p[2], p[6], p[5])
    m.quad(p[2], p[3], p[7], p[6])
    m.quad(p[3], p[0], p[4], p[7])


def ring(cx, cy, r, z, n=SEGS):
    return [
        (cx + r * math.cos(2 * math.pi * i / n),
         cy + r * math.sin(2 * math.pi * i / n),
         z)
        for i in range(n)
    ]


def tube_ring_z(m, cx, cy, ro, ri, z0, z1, n=SEGS):
    """A hollow collar: outer wall, inner wall, and closed top/bottom annuli."""
    o0, o1 = ring(cx, cy, ro, z0, n), ring(cx, cy, ro, z1, n)
    i0, i1 = ring(cx, cy, ri, z0, n), ring(cx, cy, ri, z1, n)
    for i in range(n):
        j = (i + 1) % n
        m.quad(o0[i], o0[j], o1[j], o1[i])   # outer
        m.quad(i0[j], i0[i], i1[i], i1[j])   # inner
        m.quad(o1[i], o1[j], i1[j], i1[i])   # top annulus
        m.quad(o0[j], o0[i], i0[i], i0[j])   # bottom annulus


def collar(m, cx, cy, z0, z1):
    """Vial well = a collar standing on the plate; vial rests on the plate."""
    tube_ring_z(m, cx, cy, WELL_OD / 2, WELL_ID / 2, z0, z1)
    # small inner shelf ring so vials of slightly smaller OD stay centered
    tube_ring_z(m, cx, cy, WELL_ID / 2, WELL_ID / 2 - 1.4, z0, z0 + 1.2)


def emboss_text(m, text, x_center, z_center, y_face, cell, proud=EMBOSS_PROUD):
    """Raised letters standing proud of a back-facing wall (protrude toward -Y)."""
    text = text.upper()
    cols, rows, gap = 5, 7, 1
    units = len(text) * cols + (len(text) - 1) * gap
    total_w = units * cell
    total_h = rows * cell
    x0 = x_center - total_w / 2
    z_top = z_center + total_h / 2
    y0, y1 = y_face - proud, y_face
    cursor = 0
    for ch in text:
        glyph = _FONT.get(ch, _FONT[" "])
        for r in range(rows):
            for c in range(cols):
                if glyph[r][c] != "1":
                    continue
                xa = x0 + (cursor + c) * cell
                xb = xa + cell * 0.9
                za = z_top - (r + 1) * cell
                zb = za + cell * 0.9
                box(m, xa, y0, za, xb, y1, zb)
        cursor += cols + gap


def make_rack(cols: int, rows: int, wordmark: str, stepped: bool = False) -> Mesh:
    m = Mesh()

    block_w = cols * WELL_OD + (cols - 1) * GAP_X
    block_d = rows * WELL_OD + (rows - 1) * GAP_Y
    slab_w = block_w + 2 * MARGIN
    slab_d = block_d + 2 * MARGIN + BACK_GAP + BACK_T

    # Floor plate
    box(m, 0, 0, 0, slab_w, slab_d, FLOOR)

    # Well collars (row 0 = front, near y=MARGIN)
    x0 = MARGIN + WELL_OD / 2
    y0 = MARGIN + WELL_OD / 2
    for r in range(rows):
        cy = y0 + r * PITCH_Y
        # Raise back rows on a step so their labels clear the front row
        step = STEP_H * r if stepped else 0.0
        if step > 0:
            box(m, MARGIN * 0.5, cy - WELL_OD / 2 - GAP_Y / 2,
                FLOOR, slab_w - MARGIN * 0.5, cy + WELL_OD / 2 + GAP_Y / 2,
                FLOOR + step)
        for c in range(cols):
            cx = x0 + c * PITCH_X
            collar(m, cx, cy, FLOOR + step, FLOOR + step + WELL_H)

    # Backboard with raised wordmark (spans the back edge of the slab)
    board_y1 = slab_d
    board_y0 = board_y1 - BACK_T
    box(m, 0, board_y0, 0, slab_w, board_y1, BACK_TOP)
    # subtle side buttresses for a stable, finished look
    for bx in (0.0, slab_w - MARGIN):
        box(m, bx, board_y0 - MARGIN, 0, bx + MARGIN, board_y0, FLOOR + 4.0)

    cell = min(2.4, (slab_w - 2 * MARGIN) /
               (len(wordmark) * 5 + (len(wordmark) - 1)))
    z_center = FLOOR + WELL_H + (BACK_TOP - (FLOOR + WELL_H)) / 2
    emboss_text(m, wordmark, slab_w / 2, z_center, board_y0, cell)

    return m


def main():
    print("Generating Undisclosed vial display racks (mm)…")
    variants = {
        "undisclosed-vial-rack.stl": (
            make_rack(6, 1, "UNDISCLOSED"),
            "6-vial display rack",
        ),
        "undisclosed-vial-rack-10.stl": (
            make_rack(5, 2, "UNDISCLOSED", stepped=True),
            "10-vial stepped riser",
        ),
        "undisclosed-vial-rack-mini.stl": (
            make_rack(3, 1, "UD"),
            "3-vial travel rack",
        ),
    }
    for name, (mesh, label) in variants.items():
        mesh.write(OUT / name, label=f"UD rack {label}")
        mesh.write(PUBLIC / name, label=f"UD rack {label}")
    print(f"Done → {OUT} and {PUBLIC}")


if __name__ == "__main__":
    main()
