"""
export_label_rect.py  —  zero-adjustment label anchor for the vial studio.

The build script already knows the label band in 3-D (label_bottom_z / label_top_z)
and renders on a FIXED, transparent canvas. The web label compositor, however,
needs that band in PIXELS so it can drop the printed label onto the exact same
rectangle every render — no detection, no per-image tweaks.

This module projects the vial's label band through the locked camera to a pixel
rectangle and writes it to JSON. Call it once per profile right after the scene
is built and the camera is placed (before or after render_still — camera + canvas
just have to be final).

    from export_label_rect import export_label_rect
    export_label_rect(
        scene, camera_obj,
        body_radius=spec_body_radius_m,      # metres, cylinder radius at the label
        label_bottom_z=geom["label_bottom_z"],
        label_top_z=geom["label_top_z"],
        profile="3ml",
        out_json=RENDERS_DIR / "label-rect-3ml.json",
    )

Output JSON (pixels, origin top-left, matches the rendered PNG):

    { "profile": "3ml", "canvas": [1024, 1536],
      "labelRectPx": { "left": 250, "top": 690, "right": 774, "bottom": 1190,
                       "width": 524, "height": 500 } }

The compositor reads labelRectPx and places the label there verbatim. Because the
camera, canvas, and mesh are locked, this rectangle is identical across every
render of that profile — so it is written once and reused forever.

Requires only Blender's bundled Python (bpy + mathutils + bpy_extras).
"""
from __future__ import annotations

import json
from pathlib import Path

import bpy  # noqa: F401  (present inside Blender)
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

# ---- LOCKED SPEC (mirror the build script's constants; assert, don't mutate) ----
LOCKED_CANVAS = {
    "3ml": (1024, 1536),
    "5ml": (1024, 1536),
    "10ml": (1024, 1536),
}
# Vial axis is +Z (up); camera looks along -Y at the front face. Silhouette
# (widest visible) points sit at x = ±radius, y = 0. Front-most surface at y = -R.


def _px(scene, cam, world_pt):
    """World XYZ -> pixel (x, y) with origin at the TOP-left of the render."""
    ndc = world_to_camera_view(scene, cam, Vector(world_pt))  # x,y in [0,1], y up
    w = scene.render.resolution_x
    h = scene.render.resolution_y
    return ndc.x * w, (1.0 - ndc.y) * h


def export_label_rect(
    scene,
    cam,
    *,
    body_radius: float,
    label_bottom_z: float,
    label_top_z: float,
    profile: str,
    out_json: str | Path,
    front_axis: str = "-Y",
) -> dict:
    """Project the label band to a pixel rectangle and write it to JSON.

    Left/right come from the cylinder silhouette (x = ±radius at y = 0);
    top/bottom come from the label band Z at the front-most surface.
    """
    expect = LOCKED_CANVAS.get(profile)
    got = (scene.render.resolution_x, scene.render.resolution_y)
    if expect and got != expect:
        raise SystemExit(
            f"[export_label_rect] canvas drift for {profile}: locked {expect}, got {got}. "
            "Do not change the canvas — labels are anchored to it."
        )
    if not scene.render.film_transparent:
        raise SystemExit("[export_label_rect] film_transparent must be True (vials are cutouts).")

    front_y = -body_radius if front_axis == "-Y" else body_radius
    z_mid = (label_top_z + label_bottom_z) / 2.0

    corners = [
        (-body_radius, 0.0, z_mid),          # silhouette left
        (+body_radius, 0.0, z_mid),          # silhouette right
        (0.0, front_y, label_top_z),         # front, top of label
        (0.0, front_y, label_bottom_z),      # front, bottom of label
    ]
    pts = [_px(scene, cam, c) for c in corners]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    left, right = min(xs), max(xs)
    top, bottom = min(ys), max(ys)

    rect = {
        "left": round(left, 1), "top": round(top, 1),
        "right": round(right, 1), "bottom": round(bottom, 1),
        "width": round(right - left, 1), "height": round(bottom - top, 1),
    }
    payload = {
        "profile": profile,
        "canvas": [scene.render.resolution_x, scene.render.resolution_y],
        "labelRectPx": rect,
        "note": "Locked camera+mesh => this rectangle is identical for every render of this profile.",
    }
    out = Path(out_json)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"[export_label_rect] {profile}: labelRectPx = {rect} -> {out}")
    return payload
