#!/usr/bin/env python3
"""
WellPept simple powder-chamber cap kit — STL generator (mm).

For Bambu Lab P1S / P1P / X1. Serums usually ship with a screw cap + glass
dropper; this kit is a temporary powder chamber you twist/press onto the
bottle neck, dump dry peptide into the serum, then swap the dropper back on.

Default size: ~18 mm neck (common 30 mL serum / 18-410 style).
Print the fit ring first and scale ±1–3% in Bambu Studio if needed.
"""
from __future__ import annotations

from pathlib import Path
import math
import struct

OUT = Path(__file__).resolve().parent

# --- Fit (edit these if your bottles differ) ---
NECK_OD = 18.0  # measure bottle thread major diameter
CLEARANCE = 0.40  # radial print clearance
SKIRT_WALL = 2.2
SKIRT_H = 11.0
POUR_D = 11.0  # hole into bottle
CHAMBER_ID = 15.5
CHAMBER_WALL = 2.2
CHAMBER_H = 12.0  # powder volume height
MEMBRANE_T = 0.5  # pierce / twist-break floor (print with 0.2 mm layers)
DECK_T = 2.0
LID_OVERLAP = 4.0
SEGS = 72


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

    def write(self, path: Path):
        with path.open("wb") as f:
            f.write(b"WellPept powder cap".ljust(80, b"\0"))
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
        print(f"  {path.name:40s}  {len(self.tris):5d} tris")


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


def ribs(m, r_outer, depth, z0, z1, count=6, width=0.12):
    """Inner grip ribs (coarse substitute for bottle threads)."""
    for k in range(count):
        a0 = 2 * math.pi * k / count - width
        a1 = 2 * math.pi * k / count + width
        ro, ri = r_outer, r_outer - depth

        def p(r, a, z):
            return (r * math.cos(a), r * math.sin(a), z)

        v = [
            p(ro, a0, z0),
            p(ro, a1, z0),
            p(ro, a1, z1),
            p(ro, a0, z1),
            p(ri, a0, z0),
            p(ri, a1, z0),
            p(ri, a1, z1),
            p(ri, a0, z1),
        ]
        m.quad(v[0], v[1], v[2], v[3])
        m.quad(v[5], v[4], v[7], v[6])
        m.quad(v[4], v[0], v[3], v[7])
        m.quad(v[1], v[5], v[6], v[2])
        m.quad(v[4], v[5], v[1], v[0])
        m.quad(v[3], v[2], v[6], v[7])


def make_chamber() -> Mesh:
    m = Mesh()
    skirt_id = NECK_OD + CLEARANCE
    skirt_od = skirt_id + 2 * SKIRT_WALL
    chamber_od = CHAMBER_ID + 2 * CHAMBER_WALL
    body_r = max(skirt_od, chamber_od) / 2
    r_neck = skirt_id / 2
    pour_r = POUR_D / 2
    r_ci = CHAMBER_ID / 2

    # 1) Neck skirt
    tube(m, body_r, r_neck, 0, SKIRT_H)
    ribs(m, r_neck, 0.65, 2.0, SKIRT_H - 1.5, count=6)
    annulus(m, body_r, r_neck, 0, up=False)

    # 2) Deck over bottle lip
    z_deck0, z_deck1 = SKIRT_H, SKIRT_H + DECK_T
    tube(m, body_r, pour_r, z_deck0, z_deck1)
    annulus(m, body_r, pour_r, z_deck0, up=False)
    annulus(m, body_r, pour_r, z_deck1, up=True)

    # 3) Thin membrane (pierce or twist-break to dump powder)
    z_m0, z_m1 = z_deck1, z_deck1 + MEMBRANE_T
    disk(m, pour_r, z_m0, up=True)
    disk(m, pour_r, z_m1, up=False)
    tube(m, pour_r, pour_r * 0.98, z_m0, z_m1)  # tiny rim; keep manifold-ish
    # score cross (thinner lanes via cutouts would be complex — mark with raised X)
    # Raised score ridges on membrane top for twist-break hint
    arm = pour_r * 0.85
    t = 0.7
    h = 0.35
    for ang in (0, math.pi / 2):
        ca, sa = math.cos(ang), math.sin(ang)

        def rp(x, y, z):
            return (x * ca - y * sa, x * sa + y * ca, z)

        # thin bar along local X
        pts = [
            rp(-arm, -t / 2, z_m1),
            rp(arm, -t / 2, z_m1),
            rp(arm, t / 2, z_m1),
            rp(-arm, t / 2, z_m1),
            rp(-arm, -t / 2, z_m1 + h),
            rp(arm, -t / 2, z_m1 + h),
            rp(arm, t / 2, z_m1 + h),
            rp(-arm, t / 2, z_m1 + h),
        ]
        m.quad(pts[0], pts[1], pts[2], pts[3])
        m.quad(pts[4], pts[7], pts[6], pts[5])
        m.quad(pts[0], pts[4], pts[5], pts[1])
        m.quad(pts[1], pts[5], pts[6], pts[2])
        m.quad(pts[2], pts[6], pts[7], pts[3])
        m.quad(pts[3], pts[7], pts[4], pts[0])

    # 4) Powder well
    z0, z1 = z_m1, z_m1 + CHAMBER_H
    tube(m, body_r, r_ci, z0, z1)
    annulus(m, r_ci, pour_r, z0, up=True)

    # 5) Lid ledge
    ledge = 1.8
    z2 = z1 + LID_OVERLAP
    tube(m, body_r, body_r - ledge, z1, z2)
    annulus(m, body_r - ledge, r_ci, z1, up=True)
    annulus(m, body_r, body_r - ledge, z2, up=True)

    return m


def make_lid() -> Mesh:
    m = Mesh()
    skirt_id = NECK_OD + CLEARANCE
    skirt_od = skirt_id + 2 * SKIRT_WALL
    chamber_od = CHAMBER_ID + 2 * CHAMBER_WALL
    body_r = max(skirt_od, chamber_od) / 2
    lid_id = body_r + 0.28
    lid_od = lid_id + 2.0
    skirt_h = LID_OVERLAP + 1.2
    top_t = 2.2

    tube(m, lid_od, lid_id, 0, skirt_h)
    annulus(m, lid_od, lid_id, 0, up=False)
    # top plate
    z0, z1 = skirt_h, skirt_h + top_t
    o0, o1 = ring(lid_od, z0), ring(lid_od, z1)
    for i in range(SEGS):
        j = (i + 1) % SEGS
        m.quad(o0[i], o0[j], o1[j], o1[i])
    disk(m, lid_od, z1, up=True)
    disk(m, lid_id, z0, up=False)

    # twist tab
    w, t, h = 14.0, 2.2, 7.0
    x0, x1 = -w / 2, w / 2
    y0, y1 = -t / 2, t / 2
    zz0, zz1 = z1, z1 + h
    p = [
        (x0, y0, zz0),
        (x1, y0, zz0),
        (x1, y1, zz0),
        (x0, y1, zz0),
        (x0, y0, zz1),
        (x1, y0, zz1),
        (x1, y1, zz1),
        (x0, y1, zz1),
    ]
    m.quad(p[0], p[1], p[2], p[3])
    m.quad(p[4], p[7], p[6], p[5])
    m.quad(p[0], p[4], p[5], p[1])
    m.quad(p[1], p[5], p[6], p[2])
    m.quad(p[2], p[6], p[7], p[3])
    m.quad(p[3], p[7], p[4], p[0])
    return m


def make_fit_ring() -> Mesh:
    """Quick fit-test ring — print this first, scale until snug on bottle neck."""
    m = Mesh()
    id_ = NECK_OD + CLEARANCE
    od = id_ + 4.0
    tube(m, od / 2, id_ / 2, 0, 6.0)
    annulus(m, od / 2, id_ / 2, 0, up=False)
    annulus(m, od / 2, id_ / 2, 6.0, up=True)
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


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    chamber = make_chamber()
    lid = make_lid()
    ring = make_fit_ring()
    chamber.write(OUT / "wellpept-powder-chamber.stl")
    lid.write(OUT / "wellpept-chamber-lid.stl")
    ring.write(OUT / "wellpept-neck-fit-ring.stl")
    plate = merge(
        translate(chamber, -26, 0),
        translate(lid, 16, 0),
        translate(ring, 16, 26),
    )
    plate.write(OUT / "wellpept-cap-kit-plate.stl")
    print("Done →", OUT)


if __name__ == "__main__":
    main()
