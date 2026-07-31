#!/usr/bin/env python3
"""
Undisclosed 10-vial kit case — STL generator (mm).

Matches the clear hinged case in the featured KLOW product photo:
  • 2×5 snug rectangular pockets for ~3 mL lyophilized vials (upright)
  • Right column of 4 circular spare-cap wells (not an open trough)
  • Thin walls for clear PETG / clear PLA
  • Hinged lid with snap latch + large inner label frame
  • Print base + lid flat (no supports); pin or 3 mm filament through knuckles

Clear filament tip: dry filament, 2–3 walls, 0–15% infill, slow outer walls.
"""
from __future__ import annotations

from pathlib import Path
import math
import struct

OUT = Path(__file__).resolve().parent
PUBLIC = Path(__file__).resolve().parents[2] / "public" / "printables"

# --- Tunable fit (matches featured clear KLOW kit look) ---
# 3 mL research vials ≈ 15–17 mm OD; pockets are snug rectangles.
CELL_W = 18.5
CELL_D = 18.5
DEPTH = 20.0  # pocket depth (floor → deck); vial sticks up into lid volume
ROWS = 2
COLS = 5
DIV = 1.2  # thin clear dividers like the photo

# Right column: 4 round wells for flip-caps (~13–15 mm OD)
CAP_WELLS = 4
CAP_WELL_OD = 16.5
CAP_WELL_ID = 14.2
CAP_COL_W = 20.0
CAP_WELL_DEPTH = 8.0

# Thin shell for clear filament translucency
WALL = 1.6
FLOOR = 1.6
RIM = 2.0
INNER_PAD = 1.6
CORNER = 4.0  # outer corner radius (approx via stepped boxes)

LID_INNER_H = 24.0  # clearance over vial tops + labels
LID_WALL = 1.6
LID_TOP = 1.6

HINGE_R = 2.8
HINGE_INNER_R = 1.45
HINGE_W = 7.0
LATCH_W = 18.0
LATCH_T = 2.0
LATCH_OVERHANG = 3.6

SEGS = 32


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

    def write(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as f:
            f.write(b"Undisclosed clear KLOW-style vial kit case".ljust(80, b"\0"))
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
        print(f"  {path.name:48s}  {len(self.tris):6d} tris")


def box(m: Mesh, x0, y0, z0, x1, y1, z1):
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    if z1 < z0:
        z0, z1 = z1, z0
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
    m.quad(p[0], p[3], p[2], p[1])
    m.quad(p[4], p[5], p[6], p[7])
    m.quad(p[0], p[1], p[5], p[4])
    m.quad(p[1], p[2], p[6], p[5])
    m.quad(p[2], p[3], p[7], p[6])
    m.quad(p[3], p[0], p[4], p[7])


def ring(cx, cy, r, z, n=SEGS):
    return [
        (
            cx + r * math.cos(2 * math.pi * i / n),
            cy + r * math.sin(2 * math.pi * i / n),
            z,
        )
        for i in range(n)
    ]


def disk(m, cx, cy, r, z, up=True, n=SEGS):
    c = (cx, cy, z)
    pts = ring(cx, cy, r, z, n)
    for i in range(n):
        j = (i + 1) % n
        if up:
            m.tri(c, pts[i], pts[j])
        else:
            m.tri(c, pts[j], pts[i])


def tube_x(m, cx, cy, cz, width, ro, ri, n=SEGS):
    x0, x1 = cx - width / 2, cx + width / 2

    def p(x, r, a):
        return (x, cy + r * math.cos(a), cz + r * math.sin(a))

    for i in range(n):
        a0 = 2 * math.pi * i / n
        a1 = 2 * math.pi * (i + 1) / n
        m.quad(p(x0, ro, a0), p(x1, ro, a0), p(x1, ro, a1), p(x0, ro, a1))
        m.quad(p(x0, ri, a1), p(x1, ri, a1), p(x1, ri, a0), p(x0, ri, a0))
        m.quad(p(x0, ro, a0), p(x0, ro, a1), p(x0, ri, a1), p(x0, ri, a0))
        m.quad(p(x1, ro, a1), p(x1, ro, a0), p(x1, ri, a0), p(x1, ri, a1))


def cylinder_z(m, cx, cy, r, z0, z1, n=SEGS):
    pts0, pts1 = ring(cx, cy, r, z0, n), ring(cx, cy, r, z1, n)
    for i in range(n):
        j = (i + 1) % n
        m.quad(pts0[i], pts0[j], pts1[j], pts1[i])
    disk(m, cx, cy, r, z0, up=False, n=n)
    disk(m, cx, cy, r, z1, up=True, n=n)


def tube_ring_z(m, cx, cy, ro, ri, z0, z1, n=SEGS):
    o0, o1 = ring(cx, cy, ro, z0, n), ring(cx, cy, ro, z1, n)
    i0, i1 = ring(cx, cy, ri, z0, n), ring(cx, cy, ri, z1, n)
    for i in range(n):
        j = (i + 1) % n
        m.quad(o0[i], o0[j], o1[j], o1[i])
        m.quad(i0[j], i0[i], i1[i], i1[j])
        m.quad(o1[i], o1[j], i1[j], i1[i])
        m.quad(o0[j], o0[i], i0[i], i0[j])


def rounded_shell_floor(m, ow, od, z0, z1, r=CORNER):
    """Floor / top plate with stepped rounded corners."""
    box(m, r, 0, z0, ow - r, od, z1)
    box(m, 0, r, z0, ow, od - r, z1)
    # corner fills
    for cx, cy in ((r, r), (ow - r, r), (r, od - r), (ow - r, od - r)):
        cylinder_z(m, cx, cy, r, z0, z1, n=16)


def layout():
    vial_block_w = COLS * CELL_W + (COLS - 1) * DIV
    vial_block_d = ROWS * CELL_D + (ROWS - 1) * DIV

    inner_w = INNER_PAD + vial_block_w + DIV + CAP_COL_W + INNER_PAD
    inner_d = INNER_PAD + vial_block_d + INNER_PAD
    outer_w = inner_w + 2 * WALL
    outer_d = inner_d + 2 * WALL
    deck_z = FLOOR + DEPTH
    base_h = deck_z + RIM
    return {
        "vial_block_w": vial_block_w,
        "vial_block_d": vial_block_d,
        "cap_col_w": CAP_COL_W,
        "inner_w": inner_w,
        "inner_d": inner_d,
        "outer_w": outer_w,
        "outer_d": outer_d,
        "deck_z": deck_z,
        "base_h": base_h,
    }


def make_base() -> Mesh:
    m = Mesh()
    L = layout()
    ow, od, bh = L["outer_w"], L["outer_d"], L["base_h"]
    deck = L["deck_z"]

    # Thin clear floor + outer walls (stepped corners)
    rounded_shell_floor(m, ow, od, 0, FLOOR)
    # Walls as four slabs (corners overlap floor cylinders visually)
    box(m, 0, CORNER, FLOOR, WALL, od - CORNER, bh)
    box(m, ow - WALL, CORNER, FLOOR, ow, od - CORNER, bh)
    box(m, CORNER, 0, FLOOR, ow - CORNER, WALL, bh)
    box(m, CORNER, od - WALL, FLOOR, ow - CORNER, od, bh)
    # corner posts
    for cx, cy in (
        (CORNER, CORNER),
        (ow - CORNER, CORNER),
        (CORNER, od - CORNER),
        (ow - CORNER, od - CORNER),
    ):
        # quarter-ish by full cylinder inside corner
        cylinder_z(m, cx, cy, CORNER, FLOOR, bh, n=16)
        # hollow leave: carve not available — keep solid corner posts for strength

    vx0 = WALL + INNER_PAD
    vy0 = WALL + (L["inner_d"] - L["vial_block_d"]) / 2

    # Thin vial dividers (photo-style grid)
    for r in range(ROWS - 1):
        y = vy0 + (r + 1) * CELL_D + r * DIV
        box(m, vx0, y, FLOOR, vx0 + L["vial_block_w"], y + DIV, deck)

    for c in range(COLS - 1):
        x = vx0 + (c + 1) * CELL_W + c * DIV
        box(m, x, vy0, FLOOR, x + DIV, vy0 + L["vial_block_d"], deck)

    # Perimeter around vial block
    box(m, vx0 - DIV, vy0 - DIV, FLOOR, vx0 + L["vial_block_w"] + DIV, vy0, deck)
    box(
        m,
        vx0 - DIV,
        vy0 + L["vial_block_d"],
        FLOOR,
        vx0 + L["vial_block_w"] + DIV,
        vy0 + L["vial_block_d"] + DIV,
        deck,
    )
    box(m, vx0 - DIV, vy0, FLOOR, vx0, vy0 + L["vial_block_d"], deck)
    box(
        m,
        vx0 + L["vial_block_w"],
        vy0,
        FLOOR,
        vx0 + L["vial_block_w"] + DIV,
        vy0 + L["vial_block_d"],
        deck,
    )

    # Soft bottom rings under each vial (center them, clear look)
    for r in range(ROWS):
        for c in range(COLS):
            cx = vx0 + c * (CELL_W + DIV) + CELL_W / 2
            cy = vy0 + r * (CELL_D + DIV) + CELL_D / 2
            tube_ring_z(m, cx, cy, 5.2, 4.0, FLOOR, FLOOR + 1.2)

    # Cap column — 4 circular wells like the featured photo
    cx0 = vx0 + L["vial_block_w"] + DIV
    # Divider wall between vials and caps
    box(m, cx0 - DIV, WALL, FLOOR, cx0, od - WALL, deck + RIM * 0.25)
    # Outer wall of cap column
    box(
        m,
        cx0 + CAP_COL_W,
        WALL + INNER_PAD,
        FLOOR,
        cx0 + CAP_COL_W + DIV,
        od - WALL - INNER_PAD,
        FLOOR + CAP_WELL_DEPTH + 2.0,
    )
    # Cap wells centered in column
    well_span = L["vial_block_d"]
    for i in range(CAP_WELLS):
        cy = vy0 + well_span * (i + 0.5) / CAP_WELLS
        cx = cx0 + CAP_COL_W / 2
        # Raised ring + recessed well
        tube_ring_z(
            m,
            cx,
            cy,
            CAP_WELL_OD / 2,
            CAP_WELL_ID / 2,
            FLOOR,
            FLOOR + CAP_WELL_DEPTH,
        )
        # Well floor slightly raised for drain / clarity
        disk(m, cx, cy, CAP_WELL_ID / 2, FLOOR + 0.6, up=True, n=24)

    # Lid seat rim
    box(m, CORNER, 0, bh - RIM, ow - CORNER, WALL * 0.9, bh)
    box(m, CORNER, od - WALL * 0.9, bh - RIM, ow - CORNER, od, bh)
    box(m, 0, CORNER, bh - RIM, WALL * 0.9, od - CORNER, bh)
    box(m, ow - WALL * 0.9, CORNER, bh - RIM, ow, od - CORNER, bh)

    # Two hinge knuckles on back (photo shows a simple dual hinge)
    hy = od + HINGE_R * 0.15
    hz = bh - HINGE_R
    for t in (0.28, 0.72):
        tube_x(m, ow * t, hy, hz, HINGE_W, HINGE_R, HINGE_INNER_R)

    # Front snap latch catch
    lx0 = ow / 2 - LATCH_W / 2
    box(m, lx0, -LATCH_T, bh - 6.5, lx0 + LATCH_W, 0.2, bh - 1.8)
    box(m, lx0, -LATCH_T - 1.2, bh - 3.8, lx0 + LATCH_W, -LATCH_T, bh - 2.2)

    return m


def make_lid() -> Mesh:
    m = Mesh()
    L = layout()
    ow, od = L["outer_w"], L["outer_d"]
    h = LID_TOP + LID_INNER_H

    # Clear lid shell — thin top + walls
    rounded_shell_floor(m, ow, od, h - LID_TOP, h)
    box(m, 0, CORNER, 0, LID_WALL, od - CORNER, h - LID_TOP)
    box(m, ow - LID_WALL, CORNER, 0, ow, od - CORNER, h - LID_TOP)
    box(m, CORNER, 0, 0, ow - CORNER, LID_WALL, h - LID_TOP)
    box(m, CORNER, od - LID_WALL, 0, ow - CORNER, od, h - LID_TOP)
    for cx, cy in (
        (CORNER, CORNER),
        (ow - CORNER, CORNER),
        (CORNER, od - CORNER),
        (ow - CORNER, od - CORNER),
    ):
        cylinder_z(m, cx, cy, CORNER, 0, h - LID_TOP, n=16)

    # Large inner label frame (featured lid card — almost full face)
    f = 3.5
    t = 1.3
    z0 = h - LID_TOP - 1.2
    z1 = h - LID_TOP
    box(m, f, f, z0, ow - f, f + t, z1)
    box(m, f, od - f - t, z0, ow - f, od - f, z1)
    box(m, f, f + t, z0, f + t, od - f - t, z1)
    box(m, ow - f - t, f + t, z0, ow - f, od - f - t, z1)

    # Lid hinge knuckles nest between base knuckles
    hy = od + HINGE_R * 0.15
    hz = HINGE_R
    for tpos in (0.40, 0.60):
        tube_x(m, ow * tpos, hy, hz, HINGE_W * 0.85, HINGE_R, HINGE_INNER_R)

    # Front snap latch
    lx0 = ow / 2 - LATCH_W / 2
    box(m, lx0, -LATCH_OVERHANG, 0, lx0 + LATCH_W, LID_WALL * 0.25, 8.5)
    box(
        m,
        lx0,
        -LATCH_OVERHANG,
        0,
        lx0 + LATCH_W,
        -LATCH_OVERHANG + LATCH_T,
        2.2,
    )

    return m


def make_pin() -> Mesh:
    m = Mesh()
    L = layout()
    length = L["outer_w"] * 0.55
    cylinder_z(m, 0, 0, HINGE_INNER_R - 0.12, 0, length, n=20)
    cylinder_z(m, 0, 0, HINGE_INNER_R + 1.2, length, length + 2.0, n=20)
    return m


def make_plate() -> Mesh:
    m = Mesh()
    L = layout()
    gap = 12.0
    m.extend(make_base(), 0, 0, 0)
    m.extend(make_lid(), L["outer_w"] + gap, 0, 0)
    m.extend(make_pin(), 0, L["outer_d"] + 14, 0)
    return m


def main():
    print("Generating clear KLOW-style vial kit case STLs (mm)…")
    L = layout()
    print(
        f"  Outer: {L['outer_w']:.1f} × {L['outer_d']:.1f} mm  "
        f"base H {L['base_h']:.1f} mm  lid inner {LID_INNER_H:.1f} mm"
    )
    print(
        f"  Vials: {ROWS}×{COLS} pockets @ {CELL_W:.1f}×{CELL_D:.1f}×{DEPTH:.0f} mm"
    )
    print(
        f"  Caps:  {CAP_WELLS} round wells · {CAP_WELL_ID:.1f} mm ID · clear walls {WALL} mm"
    )

    files = {
        "undisclosed-vial-case-base.stl": make_base(),
        "undisclosed-vial-case-lid.stl": make_lid(),
        "undisclosed-vial-case-pin.stl": make_pin(),
        "undisclosed-vial-case-plate.stl": make_plate(),
    }
    for name, mesh in files.items():
        mesh.write(OUT / name)
        mesh.write(PUBLIC / name)
    print("Done.")


if __name__ == "__main__":
    main()
