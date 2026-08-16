#!/usr/bin/env python3
"""
Undisclosed unlabeled vial studio — Blender / Cycles.

Renders the four locked stock plates from one shared scene:
  01  3 mL white lyophilized cake
  02  3 mL cobalt-blue cake   (same 3 mL mesh, cake color only)
  03  10 mL white cake
  04  10 mL B12 ruby liquid at 75% fill

Canvas is 1024 x 1536, pure black studio, black flip-off + brushed-silver crimp.
Run via blender/render.sh — do not invoke this file with system Python.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


SCRIPT_DIR = Path(os.path.dirname(os.path.realpath(__file__)))
DEFAULT_OUT = SCRIPT_DIR / "output"

CANVAS = (1024, 1536)

VARIANTS = {
    "01": {
        "file": "01_3mL_White_Powder_LOCKED.png",
        "profile": "3ml",
        "contents": "white_cake",
        "placement": "3ML_WHITE",
    },
    "02": {
        "file": "02_3mL_Cobalt_Blue_Powder_LOCKED.png",
        "profile": "3ml",
        "contents": "cobalt_cake",
        "placement": "3ML_BLUE",
    },
    "03": {
        "file": "03_10mL_White_Powder_LOCKED.png",
        "profile": "10ml",
        "contents": "white_cake",
        "placement": "10ML_WHITE",
    },
    "04": {
        "file": "04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png",
        "profile": "10ml",
        "contents": "ruby_liquid",
        "placement": "10ML_B12_LIQUID",
    },
}

# Hero-shot proportions that match the locked product photos (slightly
# chunkier than lab tubular vials so the wrap face stays wide enough).
PROFILES = {
    "3ml": {
        "r_outer": 10.25,
        "wall": 1.12,
        "heel": 1.15,
        "body_top": 33.4,
        "shoulder": 4.6,
        "neck_r": 6.55,
        "neck_h": 6.4,
        "bead_r": 7.35,
        "bead_h": 1.35,
        "lip_h": 1.05,
        "floor": 2.7,
        "cake_h": 6.4,
        "cap_r": 7.85,
        "cap_h": 2.15,
        "crimp_h": 5.4,
        "look_z": 22.2,
        "ortho": 56.8,
        "cam_y": -78.0,
        "body_height_mm": 35,
    },
    "10ml": {
        "r_outer": 13.05,
        "wall": 1.28,
        "heel": 1.35,
        "body_top": 49.6,
        "shoulder": 5.6,
        "neck_r": 10.05,
        "neck_h": 7.4,
        "bead_r": 10.85,
        "bead_h": 1.5,
        "lip_h": 1.15,
        "floor": 3.1,
        "cake_h": 8.2,
        "cap_r": 11.35,
        "cap_h": 2.35,
        "crimp_h": 6.2,
        "look_z": 30.4,
        "ortho": 78.4,
        "cam_y": -104.0,
        "body_height_mm": 52,
    },
}

WHITE_CAKE = (0.93, 0.91, 0.88, 1.0)
COBALT_CAKE = (0.015, 0.085, 0.42, 1.0)
RUBY = (0.647, 0.0, 0.094, 1.0)


def argv_after_double_dash():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return []


def parse_args():
    parser = argparse.ArgumentParser(description="Render Undisclosed vial stocks")
    parser.add_argument(
        "--variants",
        default="01,02,03,04",
        help="Comma-separated variant ids (01 02 03 04)",
    )
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--preview", action="store_true", help="512x768, 24 samples")
    parser.add_argument("--samples", type=int, default=0)
    return parser.parse_args(argv_after_double_dash())


def _purge(collection):
    for item in list(collection):
        collection.remove(item)


def reset_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    _purge(bpy.data.meshes)
    _purge(bpy.data.materials)
    _purge(bpy.data.lights)
    _purge(bpy.data.cameras)
    _purge(bpy.data.worlds)
    _purge(bpy.data.images)
    _purge(bpy.data.textures)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.max_bounces = 12
    scene.cycles.transparent_max_bounces = 12
    scene.cycles.transmission_bounces = 12
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 6
    scene.cycles.volume_bounces = 2
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.filter_glossy = 0.75
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 9
    scene.render.film_transparent = False
    scene.render.dither_intensity = 1.0
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0.15
    scene.view_settings.gamma = 1.0
    world = bpy.data.worlds.new("StudioBlack")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0.0
    return scene


def smooth_steps(a, b, count):
    out = []
    for i in range(count):
        t = i / (count - 1)
        s = t * t * (3.0 - 2.0 * t)
        out.append((a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s))
    return out


def vial_profile(p):
    r_out = p["r_outer"]
    r_in = r_out - p["wall"]
    heel = p["heel"]
    body_top = p["body_top"]
    sh = p["shoulder"]
    neck_r = p["neck_r"]
    neck_inner = neck_r - p["wall"] * 0.92
    neck_h = p["neck_h"]
    bead_r = p["bead_r"]
    bead_h = p["bead_h"]
    lip_h = p["lip_h"]
    floor = p["floor"]
    z_neck = body_top + sh
    z_bead = z_neck + neck_h
    z_lip = z_bead + bead_h
    z_top = z_lip + lip_h

    outer = [
        (0.0, 0.18),
        (r_out * 0.42, 0.06),
        (r_out - heel * 0.85, 0.0),
        (r_out, heel),
        (r_out, body_top),
    ]
    outer += smooth_steps((r_out, body_top), (neck_r, z_neck), 7)[1:]
    outer += [
        (neck_r, z_bead),
        (bead_r, z_bead + bead_h * 0.35),
        (bead_r, z_lip),
        (neck_r + 0.15, z_top),
        (neck_inner, z_top),
        (neck_inner, z_bead),
    ]
    inner = list(
        reversed(smooth_steps((r_in, body_top + 0.15), (neck_inner, z_neck), 7))
    )[1:]
    inner += [
        (r_in, body_top),
        (r_in, floor),
        (r_in * 0.55, floor * 0.92),
        (0.0, floor * 0.88),
    ]
    return outer + inner, {
        "r_inner": r_in,
        "z_floor": floor,
        "z_body_top": body_top,
        "z_neck": z_neck,
        "z_top": z_top,
        "z_bead": z_bead,
        "neck_inner": neck_inner,
        "neck_r": neck_r,
    }


def create_lathe(name, profile, segments=96):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0.0, z)) for r, z in profile]
    for i in range(len(verts) - 1):
        bm.edges.new((verts[i], verts[i + 1]))
    bm.edges.new((verts[-1], verts[0]))
    bmesh.ops.spin(
        bm,
        geom=bm.verts[:] + bm.edges[:],
        angle=math.tau,
        steps=segments,
        axis=(0.0, 0.0, 1.0),
        cent=(0.0, 0.0, 0.0),
    )
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def create_disk_volume(name, radius, z0, z1, segments=64, meniscus=0.0):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    profile = [
        (0.0, z0),
        (radius, z0),
        (radius, z1),
    ]
    if meniscus:
        for i in range(1, 9):
            t = i / 8
            r = radius * (1.0 - t)
            dip = meniscus * (1.0 - (r / radius) ** 2)
            profile.append((r, z1 - dip))
    else:
        profile.append((0.0, z1))
    verts = [bm.verts.new((r, 0.0, z)) for r, z in profile]
    for i in range(len(verts) - 1):
        bm.edges.new((verts[i], verts[i + 1]))
    bm.edges.new((verts[-1], verts[0]))
    bmesh.ops.spin(
        bm,
        geom=bm.verts[:] + bm.edges[:],
        angle=math.tau,
        steps=segments,
        axis=(0.0, 0.0, 1.0),
        cent=(0.0, 0.0, 0.0),
    )
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    return obj


def create_cap_assembly(p, dims):
    z_bead = dims["z_bead"]
    crimp_h = p["crimp_h"]
    cap_r = p["cap_r"]
    cap_h = p["cap_h"]
    neck_r = p["neck_r"]

    bpy.ops.mesh.primitive_cylinder_add(
        radius=cap_r,
        depth=cap_h,
        vertices=64,
        location=(0.0, 0.0, z_bead + crimp_h - cap_h * 0.35),
    )
    flip = bpy.context.active_object
    flip.name = "FlipCap"
    bpy.ops.object.shade_smooth()

    bpy.ops.mesh.primitive_cylinder_add(
        radius=cap_r * 0.98,
        depth=crimp_h * 0.55,
        vertices=64,
        location=(0.0, 0.0, z_bead + crimp_h * 0.62),
    )
    crimp_top = bpy.context.active_object
    crimp_top.name = "CrimpTop"
    bpy.ops.object.shade_smooth()

    bpy.ops.mesh.primitive_cylinder_add(
        radius=neck_r + 0.55,
        depth=crimp_h * 0.85,
        vertices=64,
        location=(0.0, 0.0, z_bead + crimp_h * 0.28),
    )
    crimp_skirt = bpy.context.active_object
    crimp_skirt.name = "CrimpSkirt"
    bpy.ops.object.shade_smooth()

    bpy.ops.mesh.primitive_cylinder_add(
        radius=dims["neck_inner"] * 0.96,
        depth=3.2,
        vertices=48,
        location=(0.0, 0.0, z_bead - 0.4),
    )
    stopper = bpy.context.active_object
    stopper.name = "Stopper"
    bpy.ops.object.shade_smooth()
    return flip, crimp_top, crimp_skirt, stopper


def new_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat, nodes, links, bsdf, out


def assign(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def glass_material():
    mat, nodes, links, bsdf, _out = new_material("VialGlass")
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
    bsdf.inputs["Roughness"].default_value = 0.016
    bsdf.inputs["IOR"].default_value = 1.52
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.55
    bsdf.inputs["Coat Weight"].default_value = 0.15
    bsdf.inputs["Coat Roughness"].default_value = 0.03
    return mat


def plastic_material():
    mat, _nodes, _links, bsdf, _out = new_material("FlipPlastic")
    bsdf.inputs["Base Color"].default_value = (0.012, 0.012, 0.014, 1)
    bsdf.inputs["Roughness"].default_value = 0.38
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.35
    return mat


def crimp_material():
    mat, nodes, links, bsdf, _out = new_material("CrimpAluminum")
    bsdf.inputs["Base Color"].default_value = (0.62, 0.63, 0.65, 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.28
    aniso = "Anisotropic Weight" if "Anisotropic Weight" in bsdf.inputs else "Anisotropic"
    if aniso in bsdf.inputs:
        bsdf.inputs[aniso].default_value = 0.45
    if "Anisotropic Rotation" in bsdf.inputs:
        bsdf.inputs["Anisotropic Rotation"].default_value = 0.25
    tex = nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 140
    tex.inputs["Detail"].default_value = 6
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    links.new(tex.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def stopper_material():
    mat, _nodes, _links, bsdf, _out = new_material("GrayStopper")
    bsdf.inputs["Base Color"].default_value = (0.08, 0.08, 0.085, 1)
    bsdf.inputs["Roughness"].default_value = 0.55
    return mat


def cake_material(color):
    mat, nodes, links, bsdf, _out = new_material("PeptideCake")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.72
    bsdf.inputs["Specular IOR Level"].default_value = 0.12
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.28
        bsdf.inputs["Subsurface Radius"].default_value = (0.4, 0.2, 0.12)
    if "Subsurface Scale" in bsdf.inputs:
        bsdf.inputs["Subsurface Scale"].default_value = 0.08
    vor = nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "F1"
    vor.voronoi_dimensions = "3D"
    vor.inputs["Scale"].default_value = 78
    vor.inputs["Randomness"].default_value = 0.85
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 55
    noise.inputs["Detail"].default_value = 8
    noise.inputs["Roughness"].default_value = 0.55
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "FLOAT"
    mix.inputs["Factor"].default_value = 0.45
    links.new(vor.outputs["Distance"], mix.inputs["A"])
    links.new(noise.outputs["Fac"], mix.inputs["B"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.55
    bump.inputs["Distance"].default_value = 0.12
    links.new(mix.outputs["Result"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def liquid_material():
    mat, nodes, links, bsdf, out = new_material("RubyLiquid")
    bsdf.inputs["Base Color"].default_value = RUBY
    bsdf.inputs["Roughness"].default_value = 0.02
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["IOR"].default_value = 1.333
    bsdf.inputs["Metallic"].default_value = 0.0
    vol = nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = RUBY
    vol.inputs["Density"].default_value = 3.6
    links.new(vol.outputs["Volume"], out.inputs["Volume"])
    return mat


def floor_material():
    mat, _nodes, _links, bsdf, _out = new_material("BlackFloor")
    bsdf.inputs["Base Color"].default_value = (0.0, 0.0, 0.0, 1)
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.45
    return mat


def add_area(name, loc, scale, energy, rot, size=(8, 40)):
    light = bpy.data.lights.new(name, type="AREA")
    light.shape = "RECTANGLE"
    light.size = size[0]
    light.size_y = size[1]
    light.energy = energy
    light.color = (1.0, 0.99, 0.97)
    obj = bpy.data.objects.new(name, light)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = scale
    return obj


def setup_lights(p):
    z = p["look_z"]
    add_area(
        "RimLeft",
        loc=(-22.0, 10.0, z + 4),
        scale=(1, 1, 1),
        energy=1100,
        rot=(math.radians(78), 0, math.radians(-18)),
        size=(6.5, 52),
    )
    add_area(
        "RimRight",
        loc=(24.0, 9.0, z + 2),
        scale=(1, 1, 1),
        energy=980,
        rot=(math.radians(78), 0, math.radians(20)),
        size=(6.5, 48),
    )
    add_area(
        "CapKey",
        loc=(4.0, -16.0, z + 28),
        scale=(1, 1, 1),
        energy=220,
        rot=(math.radians(55), 0, math.radians(10)),
        size=(14, 10),
    )
    add_area(
        "FillFront",
        loc=(0.0, p["cam_y"] * 0.35, z),
        scale=(1, 1, 1),
        energy=55,
        rot=(math.radians(90), 0, 0),
        size=(28, 36),
    )
    add_area(
        "CakeKiss",
        loc=(6.0, -12.0, 8.0),
        scale=(1, 1, 1),
        energy=90,
        rot=(math.radians(72), 0, math.radians(18)),
        size=(10, 8),
    )


def setup_camera(scene, p, preview):
    cam_data = bpy.data.cameras.new("StudioCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = p["ortho"]
    cam_data.clip_start = 0.1
    cam_data.clip_end = 400
    cam = bpy.data.objects.new("StudioCam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, p["cam_y"], p["look_z"])
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    scene.camera = cam
    return cam


def setup_floor():
    bpy.ops.mesh.primitive_plane_add(size=180, location=(0, 0, -0.02))
    floor = bpy.context.active_object
    floor.name = "StudioFloor"
    assign(floor, floor_material())
    return floor


def body_bounds(scene, cam, p, dims, resolution):
    r = p["r_outer"]
    z0 = p["heel"]
    z1 = dims["z_body_top"]
    corners = [
        Vector((-r, 0.0, z0)),
        Vector((r, 0.0, z0)),
        Vector((-r, 0.0, z1)),
        Vector((r, 0.0, z1)),
    ]
    xs, ys = [], []
    for co in corners:
        ndc = world_to_camera_view(scene, cam, co)
        xs.append(ndc.x * resolution[0])
        ys.append((1.0 - ndc.y) * resolution[1])
    return {
        "left": int(round(min(xs))),
        "right": int(round(max(xs))),
        "top": int(round(min(ys))),
        "bottom": int(round(max(ys))),
    }


def build_variant(scene, variant_id, preview, samples, out_dir):
    spec = VARIANTS[variant_id]
    p = PROFILES[spec["profile"]]
    reset = reset_scene()
    scene = reset
    w, h = CANVAS
    if preview:
        w, h = 512, 768
        scene.cycles.samples = samples or 24
    else:
        scene.cycles.samples = samples or 96
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = 100
    scene.render.threads_mode = "AUTO"

    profile, dims = vial_profile(p)
    glass = create_lathe("VialGlass", profile, segments=96)
    assign(glass, glass_material())

    flip, crimp_top, crimp_skirt, stopper = create_cap_assembly(p, dims)
    assign(flip, plastic_material())
    assign(crimp_top, crimp_material())
    assign(crimp_skirt, crimp_material())
    assign(stopper, stopper_material())

    r_cake = dims["r_inner"] - 0.08
    if spec["contents"] == "ruby_liquid":
        chamber_h = dims["z_body_top"] - dims["z_floor"]
        fill = dims["z_floor"] + chamber_h * 0.75
        liquid = create_disk_volume(
            "RubyLiquid",
            r_cake,
            dims["z_floor"] + 0.05,
            fill,
            meniscus=0.55,
        )
        assign(liquid, liquid_material())
    else:
        color = COBALT_CAKE if spec["contents"] == "cobalt_cake" else WHITE_CAKE
        cake = create_disk_volume(
            "PeptideCake",
            r_cake,
            dims["z_floor"] + 0.04,
            dims["z_floor"] + p["cake_h"],
            meniscus=0.12,
        )
        assign(cake, cake_material(color))

    setup_floor()
    setup_lights(p)
    cam = setup_camera(scene, p, preview)

    bounds = body_bounds(scene, cam, p, dims, (w, h))
    out_path = Path(out_dir) / spec["file"]
    if preview:
        out_path = out_path.with_name(out_path.stem + "_preview.png")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(out_path)
    bpy.ops.render.render(write_still=True)

    meta = {
        "variant": variant_id,
        "file": out_path.name,
        "placement": spec["placement"],
        "profile": spec["profile"],
        "contents": spec["contents"],
        "resolution": [w, h],
        "samples": scene.cycles.samples,
        "bodyBoundsPx": bounds,
        "bodyHeightMm": p["body_height_mm"],
        "preview": preview,
    }
    print(json.dumps(meta, indent=2))
    return meta


def main():
    args = parse_args()
    ids = [item.strip() for item in args.variants.split(",") if item.strip()]
    for item in ids:
        if item not in VARIANTS:
            raise SystemExit(f"Unknown variant {item}. Use 01,02,03,04.")
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    results = [build_variant(bpy.context.scene, item, args.preview, args.samples, out_dir) for item in ids]
    sidecar = out_dir / ("bounds.preview.json" if args.preview else "bounds.json")
    sidecar.write_text(json.dumps({"variants": results}, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {sidecar}")


if __name__ == "__main__":
    main()
