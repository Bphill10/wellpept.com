#!/usr/bin/env python3
"""
Undisclosed 10-vial research kit case — STL generator (mm).

Matches the clear hinged kit in the product photo:
  • 2×5 compartments for standard ~3 mL lyophilized vials
  • Side column with 4 spare-cap pockets
  • Separate lid with hinge knuckles + front snap latch
  • Inner lid frame for a wrap label

Print base + lid flat on the bed (no supports). Use printed pin,
3 mm filament, or wire through the hinge knuckles.
"""
from __future__ import annotations

from pathlib import Path
import math
import struct

OUT = Path(__file__).resolve().parent
PUBLIC = Path(__file__).resolve().parents[2] / "public" / "printables"

# --- Tunable fit (3 mL research vials) ---
CELL = 20.0  # vial pocket footprint (X/Y)
DEPTH = 22.0  # vial pocket depth (floor → deck)
ROWS = 2
COLS = 5
DIV = 1.6  # divider thickness

# Side trough for spare flip-off caps (open channel, like the photo)
CAP_TROUGH_W = 24.0
CAP_TROUGH_DEPTH = 14.0

WALL = 2.4
FLOOR = 2.4
RIM = 2.5
INNER_PAD = 2.0

LID_INNER_H = 22.0
LID_WALL = 2.4
LID_TOP = 2.4

HINGE_R = 3.2
HINGE_INNER_R = 1.55
HINGE_W = 6.5
LATCH_W = 16.0
LATCH_T = 2.2
LATCH_OVERHANG = 4.0

SEGS = 28


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
            f.write(b"Undisclosed vial kit case".ljust(80, b"\0"))
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
    m.quad(p[0], p[3], p[2], p[1])  # bottom
    m.quad(p[4], p[5], p[6], p[7])  # top
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
    """Tube along X axis (hinge knuckle)."""
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


def layout():
    vial_block_w = COLS * CELL + (COLS - 1) * DIV
    vial_block_d = ROWS * CELL + (ROWS - 1) * DIV

    inner_w = INNER_PAD + vial_block_w + DIV + CAP_TROUGH_W + INNER_PAD
    inner_d = INNER_PAD + vial_block_d + INNER_PAD
    outer_w = inner_w + 2 * WALL
    outer_d = inner_d + 2 * WALL
    deck_z = FLOOR + DEPTH
    base_h = deck_z + RIM
    return {
        "vial_block_w": vial_block_w,
        "vial_block_d": vial_block_d,
        "cap_trough_w": CAP_TROUGH_W,
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

    # Floor + outer walls
    box(m, 0, 0, 0, ow, od, FLOOR)
    box(m, 0, 0, FLOOR, WALL, od, bh)
    box(m, ow - WALL, 0, FLOOR, ow, od, bh)
    box(m, WALL, 0, FLOOR, ow - WALL, WALL, bh)
    box(m, WALL, od - WALL, FLOOR, ow - WALL, od, bh)

    # Origin of vial grid (inner)
    vx0 = WALL + INNER_PAD
    # Vertically center vial block
    vy0 = WALL + (L["inner_d"] - L["vial_block_d"]) / 2

    # Vial pocket floors sit on main floor; dividers rise to deck
    for r in range(ROWS - 1):
        y = vy0 + (r + 1) * CELL + r * DIV
        box(m, vx0, y, FLOOR, vx0 + L["vial_block_w"], y + DIV, deck)

    for c in range(COLS - 1):
        x = vx0 + (c + 1) * CELL + c * DIV
        box(m, x, vy0, FLOOR, x + DIV, vy0 + L["vial_block_d"], deck)

    # Perimeter wall around vial block
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

    for r in range(ROWS):
        for c in range(COLS):
            cx = vx0 + c * (CELL + DIV) + CELL / 2
            cy = vy0 + r * (CELL + DIV) + CELL / 2
            tube_ring_z(m, cx, cy, 5.5, 4.2, FLOOR, FLOOR + 1.4)

    # Cap trough to the right of the vial block (open channel for ~4 flip caps)
    cx0 = vx0 + L["vial_block_w"] + DIV
    cy0 = WALL + INNER_PAD
    cy1 = od - WALL - INNER_PAD
    box(m, cx0 - DIV, WALL, FLOOR, cx0, od - WALL, deck + RIM * 0.35)
    # Side + end walls of trough; open top
    box(m, cx0 + CAP_TROUGH_W, cy0, FLOOR, cx0 + CAP_TROUGH_W + DIV, cy1, FLOOR + CAP_TROUGH_DEPTH)
    box(m, cx0, cy0 - DIV, FLOOR, cx0 + CAP_TROUGH_W + DIV, cy0, FLOOR + CAP_TROUGH_DEPTH)
    box(m, cx0, cy1, FLOOR, cx0 + CAP_TROUGH_W + DIV, cy1 + DIV, FLOOR + CAP_TROUGH_DEPTH)
    # Soft cradle rings along the trough
    trough_len = cy1 - cy0
    for i in range(4):
        cy = cy0 + trough_len * (i + 0.5) / 4
        tube_ring_z(
            m,
            cx0 + CAP_TROUGH_W / 2,
            cy,
            7.0,
            5.8,
            FLOOR,
            FLOOR + 1.2,
        )

    # Top rim (lid seat)
    box(m, 0, 0, bh - RIM, ow, WALL * 0.85, bh)
    box(m, 0, od - WALL * 0.85, bh - RIM, ow, od, bh)
    box(m, 0, WALL * 0.85, bh - RIM, WALL * 0.85, od - WALL * 0.85, bh)
    box(m, ow - WALL * 0.85, WALL * 0.85, bh - RIM, ow, od - WALL * 0.85, bh)

    # Hinge knuckles (back) — 3 on base
    hy = od + HINGE_R * 0.2
    hz = bh - HINGE_R
    for t in (0.20, 0.50, 0.80):
        tube_x(m, ow * t, hy, hz, HINGE_W, HINGE_R, HINGE_INNER_R)

    # Front latch catch
    lx0 = ow / 2 - LATCH_W / 2
    box(m, lx0, -LATCH_T, bh - 7.0, lx0 + LATCH_W, 0.15, bh - 2.0)
    box(m, lx0, -LATCH_T - 1.4, bh - 4.2, lx0 + LATCH_W, -LATCH_T, bh - 2.4)

    return m


def tube_ring_z(m, cx, cy, ro, ri, z0, z1, n=SEGS):
    o0, o1 = ring(cx, cy, ro, z0, n), ring(cx, cy, ro, z1, n)
    i0, i1 = ring(cx, cy, ri, z0, n), ring(cx, cy, ri, z1, n)
    for i in range(n):
        j = (i + 1) % n
        m.quad(o0[i], o0[j], o1[j], o1[i])
        m.quad(i0[j], i0[i], i1[i], i1[j])
        m.quad(o1[i], o1[j], i1[j], i1[i])
        m.quad(o0[j], o0[i], i0[i], i0[j])


def make_lid() -> Mesh:
    m = Mesh()
    L = layout()
    ow, od = L["outer_w"], L["outer_d"]
    h = LID_TOP + LID_INNER_H

    # Top plate + walls hanging down (open at z=0)
    box(m, 0, 0, h - LID_TOP, ow, od, h)
    box(m, 0, 0, 0, LID_WALL, od, h - LID_TOP)
    box(m, ow - LID_WALL, 0, 0, ow, od, h - LID_TOP)
    box(m, LID_WALL, 0, 0, ow - LID_WALL, LID_WALL, h - LID_TOP)
    box(m, LID_WALL, od - LID_WALL, 0, ow - LID_WALL, od, h - LID_TOP)

    # Inner label frame on underside of top
    f = 5.0
    t = 1.5
    z0 = h - LID_TOP - 1.4
    z1 = h - LID_TOP
    box(m, f, f, z0, ow - f, f + t, z1)
    box(m, f, od - f - t, z0, ow - f, od - f, z1)
    box(m, f, f + t, z0, f + t, od - f - t, z1)
    box(m, ow - f - t, f + t, z0, ow - f, od - f - t, z1)

    # Hinge knuckles — 2 on lid, nest between base knuckles
    hy = od + HINGE_R * 0.2
    hz = HINGE_R
    for tpos in (0.35, 0.65):
        tube_x(m, ow * tpos, hy, hz, HINGE_W, HINGE_R, HINGE_INNER_R)

    # Front snap latch
    lx0 = ow / 2 - LATCH_W / 2
    box(m, lx0, -LATCH_OVERHANG, 0, lx0 + LATCH_W, LID_WALL * 0.2, 9.0)
    box(
        m,
        lx0,
        -LATCH_OVERHANG,
        0,
        lx0 + LATCH_W,
        -LATCH_OVERHANG + LATCH_T,
        2.4,
    )

    return m


def make_pin() -> Mesh:
    m = Mesh()
    L = layout()
    length = L["outer_w"] * 0.72
    cylinder_z(m, 0, 0, HINGE_INNER_R - 0.15, 0, length, n=20)
    cylinder_z(m, 0, 0, HINGE_INNER_R + 1.3, length, length + 2.2, n=20)
    return m


def make_plate() -> Mesh:
    m = Mesh()
    L = layout()
    gap = 10.0
    m.extend(make_base(), 0, 0, 0)
    m.extend(make_lid(), L["outer_w"] + gap, 0, 0)
    # pin above
    m.extend(make_pin(), 0, L["outer_d"] + 12, 0)
    return m


def main():
    print("Generating Undisclosed vial kit case STLs (mm)…")
    L = layout()
    print(
        f"  Outer: {L['outer_w']:.1f} × {L['outer_d']:.1f} mm  "
        f"base H {L['base_h']:.1f} mm  lid inner {LID_INNER_H:.1f} mm"
    )
    print(f"  Vials: {ROWS}×{COLS} pockets @ {CELL:.0f}×{CELL:.0f}×{DEPTH:.0f} mm")
    print(f"  Caps:  open trough {CAP_TROUGH_W:.0f} mm wide")

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
