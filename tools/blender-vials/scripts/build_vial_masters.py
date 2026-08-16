#!/usr/bin/env python3
"""
Build three locked pharmaceutical vial masters in Blender 5.2 / Cycles.

Capacities: 3 mL, 5 mL, 10 mL. Contents are variants of those masters.
30 mL is not built in this pass.

All millimeter dimensions live in VIAL_SPECS. Derived label and chamber
math is computed from those specs only. Do not invoke this file with
system Python.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


SCRIPT_DIR = Path(os.path.dirname(os.path.realpath(__file__)))
TOOL_ROOT = SCRIPT_DIR.parent
MASTERS_DIR = TOOL_ROOT / "masters"
RENDERS_DIR = TOOL_ROOT / "renders"

# Cycles treats 1 Blender unit as 1 meter.
MM = 0.001

# ---------------------------------------------------------------------------
# Master specifications (millimeters). Edit here; everything else derives.
# Typical Type I serum-vial proportions, not a uniform scale of one mesh.
# 3 mL = 13 mm finish, compact. 5 mL = 20 mm finish, intermediate.
# 10 mL = 20 mm finish, broader and taller.
# ---------------------------------------------------------------------------
VIAL_SPECS = {
    "3ml": {
        "capacity_ml": 3,
        "r_outer": 8.35,          # 16.7 mm OD
        "wall": 1.05,
        "heel": 1.90,
        "body_bottom_z": 2.70,    # start of full-diameter straight wall
        "body_top_z": 24.80,      # end of straight wall / start of shoulder
        "shoulder_h": 6.50,
        "neck_r": 5.20,
        "neck_h": 5.10,
        "bead_r": 6.50,           # 13 mm finish
        "bead_h": 1.40,
        "lip_h": 0.85,
        "floor": 3.00,            # inner cavity floor (heavy bottom)
        "inner_dish": 0.22,
        "inner_fillet": 1.35,
        "cake_fill": 0.20,
        "liquid_fill": 0.75,
        "cap_r": 6.85,
        "cap_h": 2.35,
        "cap_chamfer": 0.18,
        "crimp_h": 2.55,
        "crimp_overhang": 0.18,
        "stopper_inset": 3.40,
        "label_frac": 0.80,       # 10 / 80 / 10
        "label_clearance": 0.07,
        "label_thickness": 0.05,
        "segments": 128,
    },
    "5ml": {
        "capacity_ml": 5,
        "r_outer": 11.05,         # 22.1 mm OD
        "wall": 1.15,
        "heel": 2.15,
        "body_bottom_z": 3.15,
        "body_top_z": 32.60,
        "shoulder_h": 7.40,
        "neck_r": 8.05,
        "neck_h": 5.70,
        "bead_r": 9.95,           # 20 mm finish
        "bead_h": 1.55,
        "lip_h": 0.95,
        "floor": 3.45,
        "inner_dish": 0.26,
        "inner_fillet": 1.55,
        "cake_fill": 0.20,
        "liquid_fill": 0.75,
        "cap_r": 10.25,
        "cap_h": 2.50,
        "cap_chamfer": 0.20,
        "crimp_h": 2.75,
        "crimp_overhang": 0.20,
        "stopper_inset": 3.80,
        "label_frac": 0.80,       # 10 / 80 / 10
        "label_clearance": 0.07,
        "label_thickness": 0.05,
        "segments": 128,
    },
    "10ml": {
        "capacity_ml": 10,
        "r_outer": 12.15,         # 24.3 mm OD
        "wall": 1.20,
        "heel": 2.45,
        "body_bottom_z": 3.55,
        "body_top_z": 43.20,
        "shoulder_h": 8.20,
        "neck_r": 8.15,
        "neck_h": 5.90,
        "bead_r": 10.05,          # 20 mm finish
        "bead_h": 1.60,
        "lip_h": 1.00,
        "floor": 3.90,
        "inner_dish": 0.30,
        "inner_fillet": 1.75,
        "cake_fill": 0.20,
        "liquid_fill": 0.75,
        "cap_r": 10.35,
        "cap_h": 2.55,
        "cap_chamfer": 0.20,
        "crimp_h": 2.85,
        "crimp_overhang": 0.22,
        "stopper_inset": 4.00,
        "label_frac": 0.70,       # 15 / 70 / 15
        "label_clearance": 0.07,
        "label_thickness": 0.05,
        "segments": 128,
    },
}

PREVIEW_VARIANTS = [
    {"id": "3ml-cobalt", "capacity": "3ml", "contents": "cobalt_cake", "file": "preview-3ml-cobalt.png"},
    {"id": "3ml-white", "capacity": "3ml", "contents": "white_cake", "file": "preview-3ml-white.png"},
    {"id": "5ml-white", "capacity": "5ml", "contents": "white_cake", "file": "preview-5ml-white.png"},
    {"id": "10ml-white", "capacity": "10ml", "contents": "white_cake", "file": "preview-10ml-white.png"},
    {"id": "10ml-red", "capacity": "10ml", "contents": "red_liquid", "file": "preview-10ml-red.png"},
]

PREVIEW_SIZE = (800, 1000)
COMPARISON_SIZE = (2000, 1000)
PREVIEW_SAMPLES = 28


def argv_after_double_dash():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return []


def parse_args():
    parser = argparse.ArgumentParser(description="Build Undisclosed vial masters")
    parser.add_argument("--samples", type=int, default=PREVIEW_SAMPLES)
    parser.add_argument("--skip-render", action="store_true")
    return parser.parse_args(argv_after_double_dash())


def mm(value):
    return value * MM


def shoulder_radius(r0, r1, t):
    """Cosine ease: vertical tangent at both ends, no conical mid-slope."""
    s = 0.5 * (1.0 - math.cos(math.pi * t))
    return r0 + (r1 - r0) * s


def derived(spec):
    """All computed measurements in millimeters, from VIAL_SPECS only."""
    body_bottom = spec["body_bottom_z"]
    body_top = spec["body_top_z"]
    labelable = body_top - body_bottom
    label_h = labelable * spec["label_frac"]
    expose = (labelable - label_h) / 2.0
    label_bottom = body_bottom + expose
    label_top = label_bottom + label_h
    z_neck = body_top + spec["shoulder_h"]
    z_bead = z_neck + spec["neck_h"]
    z_lip = z_bead + spec["bead_h"]
    z_top = z_lip + spec["lip_h"]
    r_inner = spec["r_outer"] - spec["wall"]
    neck_inner = spec["neck_r"] - spec["wall"] * 0.90

    # Actual internal glass chamber: inner floor -> inner neck entrance.
    # Contents are placed from this chamber only. Label math is independent.
    internal_bottom_z = spec["floor"]
    internal_top_z = z_neck
    internal_chamber_height = internal_top_z - internal_bottom_z
    cake_h = internal_chamber_height * spec["cake_fill"]
    liquid_h = internal_chamber_height * spec["liquid_fill"]
    fill_75_z = internal_bottom_z + liquid_h

    z_crimp0 = z_bead - 0.18
    z_crimp1 = z_crimp0 + spec["crimp_h"]
    z_cap0 = z_crimp1 - 0.08
    z_cap1 = z_cap0 + spec["cap_h"]

    if fill_75_z > label_top + 0.05:
        liquid_vs_label = "ABOVE LABEL"
    elif fill_75_z < label_bottom - 0.05:
        liquid_vs_label = "BELOW LABEL"
    else:
        liquid_vs_label = "BEHIND LABEL"

    return {
        "labelable_body_bottom_z": body_bottom,
        "labelable_body_top_z": body_top,
        "labelable_body_height": labelable,
        "label_height": label_h,
        "label_bottom_z": label_bottom,
        "label_top_z": label_top,
        "expose_frac": expose / labelable if labelable else 0.0,
        "z_neck": z_neck,
        "z_bead": z_bead,
        "z_lip": z_lip,
        "z_top": z_top,
        "z_cap0": z_cap0,
        "z_cap1": z_cap1,
        "z_crimp0": z_crimp0,
        "z_crimp1": z_crimp1,
        "r_inner": r_inner,
        "neck_inner": neck_inner,
        "internal_bottom_z": internal_bottom_z,
        "internal_top_z": internal_top_z,
        "internal_chamber_height": internal_chamber_height,
        "fill_75_z": fill_75_z,
        "liquid_vs_label": liquid_vs_label,
        "cake_h": cake_h,
        "liquid_h": liquid_h,
        "chamber_h": internal_chamber_height,
        "total_glass_h": z_top,
        "total_assembly_h": z_cap1,
    }


def shoulder_curve(r0, z0, r1, z1, count):
    """Smooth pharmaceutical shoulder: vertical wall -> rounded fillet -> neck."""
    out = []
    for i in range(count):
        t = i / (count - 1)
        out.append((shoulder_radius(r0, r1, t), z0 + (z1 - z0) * t))
    return out


def inner_radius_at_z(spec, d, z):
    """Inner chamber radius at height z, including the shoulder taper."""
    if z <= spec["body_top_z"]:
        return d["r_inner"]
    if z >= d["z_neck"]:
        return d["neck_inner"]
    t = (z - spec["body_top_z"]) / spec["shoulder_h"]
    return shoulder_radius(d["r_inner"], d["neck_inner"], t)


def _purge(collection):
    for item in list(collection):
        collection.remove(item)


def reset_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for coll in list(bpy.data.collections):
        if coll.name != "Collection":
            bpy.data.collections.remove(coll)
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
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.03
    scene.cycles.max_bounces = 16
    scene.cycles.transparent_max_bounces = 16
    scene.cycles.transmission_bounces = 16
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 8
    scene.cycles.volume_bounces = 4
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    if hasattr(scene.cycles, "blur_glossy"):
        scene.cycles.blur_glossy = 0.6
    elif hasattr(scene.cycles, "filter_glossy"):
        scene.cycles.filter_glossy = 0.6
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 9
    scene.render.film_transparent = True
    scene.render.dither_intensity = 1.0
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.20
    scene.view_settings.gamma = 1.0
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    # Film is transparent; world still lights refraction/reflections.
    bg.inputs["Color"].default_value = (0.62, 0.63, 0.65, 1)
    bg.inputs["Strength"].default_value = 0.55
    return scene


def ensure_collection(name):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def link_exclusive(obj, collection):
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    collection.objects.link(obj)


def shade_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def create_lathe(name, profile_mm, segments=128):
    rings = len(profile_mm)
    verts = []
    for i in range(segments):
        angle = (i / segments) * math.tau
        cosine = math.cos(angle)
        sine = math.sin(angle)
        for radius, z in profile_mm:
            verts.append((mm(radius) * cosine, mm(radius) * sine, mm(z)))
    faces = []
    for i in range(segments):
        nxt = (i + 1) % segments
        for j in range(rings):
            jn = (j + 1) % rings
            a = i * rings + j
            b = nxt * rings + j
            c = nxt * rings + jn
            d = i * rings + jn
            faces.append((a, d, c, b))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    shade_smooth(obj)
    return obj


def set_input(bsdf, names, value):
    for name in names:
        if name in bsdf.inputs:
            socket = bsdf.inputs[name]
            if hasattr(socket, "default_value"):
                socket.default_value = value
            return True
    return False


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


def build_materials():
    mats = {}

    glass, nodes, links, bsdf, out = new_material("MAT_GLASS_BOROSILICATE")
    set_input(bsdf, ["Base Color"], (0.99, 0.995, 1.0, 1))
    set_input(bsdf, ["Roughness"], 0.0)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["IOR"], 1.47)
    set_input(bsdf, ["Transmission Weight", "Transmission"], 1.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.5)
    set_input(bsdf, ["Coat Weight"], 0.0)
    vol = nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = (0.97, 0.98, 0.99, 1)
    # Density is 1/m. Thick bottoms are ~0.004 m; keep a whisper of presence.
    vol.inputs["Density"].default_value = 1.8
    links.new(vol.outputs["Volume"], out.inputs["Volume"])
    mats["glass"] = glass

    stopper, _n, _l, bsdf, _o = new_material("MAT_STOPPER_GRAY")
    set_input(bsdf, ["Base Color"], (0.28, 0.28, 0.29, 1))
    set_input(bsdf, ["Roughness"], 0.82)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.06)
    set_input(bsdf, ["Coat Weight"], 0.0)
    set_input(bsdf, ["Emission Strength"], 0.0)
    mats["stopper"] = stopper

    crimp, nodes, links, bsdf, _o = new_material("MAT_CRIMP_SILVER")
    set_input(bsdf, ["Base Color"], (0.52, 0.53, 0.55, 1))
    set_input(bsdf, ["Metallic"], 1.0)
    set_input(bsdf, ["Roughness"], 0.38)
    set_input(bsdf, ["Anisotropic Weight", "Anisotropic"], 0.62)
    set_input(bsdf, ["Anisotropic Rotation"], 0.25)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.45)
    set_input(bsdf, ["Coat Weight"], 0.0)
    tex = nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 260
    tex.inputs["Detail"].default_value = 6
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    links.new(tex.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["crimp"] = crimp

    cap, _n, _l, bsdf, _o = new_material("MAT_CAP_BLACK")
    set_input(bsdf, ["Base Color"], (0.012, 0.012, 0.013, 1))
    set_input(bsdf, ["Roughness"], 0.92)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.02)
    set_input(bsdf, ["Coat Weight"], 0.0)
    set_input(bsdf, ["Emission Strength"], 0.0)
    set_input(bsdf, ["Sheen Weight"], 0.0)
    mats["cap"] = cap

    label, nodes, links, bsdf, _o = new_material("MAT_LABEL_WHITE")
    set_input(bsdf, ["Base Color"], (0.91, 0.91, 0.90, 1))
    set_input(bsdf, ["Roughness"], 0.62)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.08)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 240
    noise.inputs["Detail"].default_value = 8
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.025
    bump.inputs["Distance"].default_value = mm(0.04)
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["label"] = label

    def cake_mat(name, color):
        mat, nodes, links, bsdf, out = new_material(name)
        set_input(bsdf, ["Base Color"], color)
        set_input(bsdf, ["Roughness"], 0.86)
        set_input(bsdf, ["Specular IOR Level", "Specular"], 0.03)
        set_input(bsdf, ["Subsurface Weight", "Subsurface"], 0.22)
        set_input(bsdf, ["Subsurface Radius"], (0.40, 0.28, 0.18))
        set_input(bsdf, ["Subsurface Scale"], 0.0022)
        set_input(bsdf, ["Metallic"], 0.0)
        set_input(bsdf, ["Emission Strength"], 0.0)
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 420
        noise.inputs["Detail"].default_value = 14
        noise.inputs["Roughness"].default_value = 0.55
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.18
        bump.inputs["Distance"].default_value = mm(0.028)
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        return mat

    mats["cake_white"] = cake_mat("MAT_CAKE_WHITE", (0.94, 0.93, 0.90, 1))
    mats["cake_cobalt"] = cake_mat("MAT_CAKE_COBALT", (0.035, 0.145, 0.52, 1))

    liquid, nodes, links, bsdf, out = new_material("MAT_LIQUID_RED")
    set_input(bsdf, ["Base Color"], (0.42, 0.02, 0.05, 1))
    set_input(bsdf, ["Roughness"], 0.0)
    set_input(bsdf, ["Transmission Weight", "Transmission"], 1.0)
    set_input(bsdf, ["IOR"], 1.333)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.28)
    set_input(bsdf, ["Emission Strength"], 0.0)
    vol = nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = (0.48, 0.018, 0.045, 1)
    # Density is 1/m. A 24 mm path needs ~100-180 to read as deep ruby.
    vol.inputs["Density"].default_value = 145.0
    links.new(vol.outputs["Volume"], out.inputs["Volume"])
    mats["liquid"] = liquid
    return mats


def heel_arc(r_out, heel, count=10):
    """Rounded exterior heel from the flat bottom into the straight wall."""
    pts = []
    for i in range(count):
        t = i / (count - 1)
        ang = t * (math.pi * 0.5)
        pts.append((r_out - heel + heel * math.sin(ang), heel - heel * math.cos(ang)))
    return pts


def inner_floor_profile(spec, d):
    """Inner cavity floor: fillet from the wall, slight concave dish, axis."""
    r_in = d["r_inner"]
    floor = spec["floor"]
    fillet = spec["inner_fillet"]
    dish = spec["inner_dish"]
    pts = []
    for i in range(8):
        t = i / 7
        ang = t * (math.pi * 0.5)
        pts.append((r_in - fillet + fillet * math.cos(ang), floor + fillet - fillet * math.sin(ang)))
    # Concave dish: walls at `floor`, center slightly lower.
    pts += [
        (r_in * 0.62, floor - dish * 0.35),
        (r_in * 0.28, floor - dish * 0.85),
        (0.0, floor - dish),
    ]
    return pts


def glass_profile(spec, d):
    r_out = spec["r_outer"]
    r_in = d["r_inner"]
    heel = spec["heel"]
    body_top = spec["body_top_z"]
    body_bottom = spec["body_bottom_z"]
    neck_r = spec["neck_r"]
    neck_inner = d["neck_inner"]
    bead_r = spec["bead_r"]
    bead_h = spec["bead_h"]
    z_neck = d["z_neck"]
    z_bead = d["z_bead"]
    z_lip = d["z_lip"]
    z_top = d["z_top"]

    outer = [
        (0.0, 0.18),
        (r_out * 0.38, 0.04),
        (r_out - heel, 0.0),
    ]
    outer += heel_arc(r_out, heel, 12)[1:]
    if body_bottom > heel + 0.05:
        outer.append((r_out, body_bottom))
    outer.append((r_out, body_top))
    outer += shoulder_curve(r_out, body_top, neck_r, z_neck, 28)[1:]
    outer += [
        (neck_r, z_bead),
        (bead_r, z_bead + bead_h * 0.40),
        (bead_r, z_lip),
        (neck_r + 0.10, z_top),
        (neck_inner, z_top),
        (neck_inner, z_bead),
    ]
    inner = list(reversed(shoulder_curve(r_in, body_top, neck_inner, z_neck, 20)))[1:]
    inner += [(r_in, body_top)]
    inner += inner_floor_profile(spec, d)
    return outer + inner, neck_inner


def cake_irregularity(angle, radius_frac):
    """Mostly level top with slight natural freeze-dry variation. Not a cone."""
    return (
        0.10 * math.sin(3.0 * angle)
        + 0.07 * math.sin(7.0 * angle + 0.6)
        + 0.05 * math.cos(5.0 * angle + 1.1)
        + 0.04 * math.sin(11.0 * angle + radius_frac * 2.2)
    ) * (0.35 + 0.65 * radius_frac)


def create_cake(name, spec, d, segments=96):
    """Cohesive cylindrical cake to the inner wall, fine irregular top."""
    r_max = d["r_inner"] - 0.07
    z0 = d["internal_bottom_z"]
    z1 = z0 + d["cake_h"]
    dish = spec["inner_dish"]
    side_rings = 6
    top_rings = 6
    bot_rings = 5
    verts = []
    rings = 1 + bot_rings + side_rings + top_rings + 1
    for i in range(segments):
        angle = (i / segments) * math.tau
        cosine = math.cos(angle)
        sine = math.sin(angle)
        side_r = r_max * (
            1.0
            + 0.007 * math.sin(13.0 * angle)
            + 0.005 * math.cos(9.0 * angle + 0.4)
        )
        # Bottom center, then dish out to the wall.
        verts.append((0.0, 0.0, mm(z0 - dish)))
        for j in range(bot_rings):
            t = (j + 1) / bot_rings
            rr = side_r * t
            zz = z0 - dish * (1.0 - t * t)
            verts.append((mm(rr) * cosine, mm(rr) * sine, mm(zz)))
        for j in range(side_rings):
            t = (j + 1) / side_rings
            zz = z0 + (z1 - z0) * t
            verts.append((mm(side_r) * cosine, mm(side_r) * sine, mm(zz)))
        for j in range(top_rings):
            t = (j + 1) / top_rings
            rr = side_r * (1.0 - t)
            irr = cake_irregularity(angle, 1.0 - t)
            verts.append((mm(max(rr, 0.02)) * cosine, mm(max(rr, 0.02)) * sine, mm(z1 + irr)))
        verts.append((0.0, 0.0, mm(z1 + cake_irregularity(angle, 0.0) * 0.4)))
    faces = []
    for i in range(segments):
        nxt = (i + 1) % segments
        for j in range(rings - 1):
            a = i * rings + j
            b = nxt * rings + j
            c = nxt * rings + j + 1
            d_i = i * rings + j + 1
            faces.append((a, d_i, c, b))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    shade_smooth(obj)
    tex = bpy.data.textures.new(f"{name}_Pore", "CLOUDS")
    tex.noise_scale = 0.0009
    tex.noise_depth = 2
    disp = obj.modifiers.new("CakePore", "DISPLACE")
    disp.texture = tex
    disp.strength = mm(0.055)
    disp.mid_level = 0.5
    return obj


def liquid_profile(spec, d):
    """Closed liquid volume conforming to the inner chamber, 75% fill + meniscus."""
    z0 = d["internal_bottom_z"]
    z1 = d["fill_75_z"]
    dish = spec["inner_dish"]
    r_wall = d["r_inner"] - 0.04
    core = 0.02
    meniscus = 0.28
    profile = [(core, z0 - dish)]
    for i in range(1, 6):
        t = i / 5
        profile.append((r_wall * t, z0 - dish * (1.0 - t * t)))
    # Climb the inner wall, following the shoulder if the fill reaches it.
    climb = 16
    z_start = z0 + 0.02
    for i in range(climb + 1):
        t = i / climb
        z = z_start + (z1 - z_start) * t
        profile.append((inner_radius_at_z(spec, d, z) - 0.04, z))
    # Subtle concave meniscus at the true 75% surface.
    r_top = inner_radius_at_z(spec, d, z1) - 0.04
    for i in range(1, 10):
        t = i / 9
        rr = r_top * (1.0 - t)
        dip = meniscus * (1.0 - (max(rr, core) / r_top) ** 2)
        profile.append((max(rr, core), z1 - dip))
    return profile


def create_label_wrap(name, spec, d):
    """Single-wall cylindrical wrap with a solidify thickness. No inner tube."""
    radius = mm(spec["r_outer"] + spec["label_clearance"])
    z0 = mm(d["label_bottom_z"])
    z1 = mm(d["label_top_z"])
    segments = spec["segments"]
    verts = []
    for i in range(segments):
        angle = (i / segments) * math.tau
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        verts.append((x, y, z0))
        verts.append((x, y, z1))
    faces = []
    for i in range(segments):
        a = i * 2
        b = a + 1
        c = ((i + 1) % segments) * 2 + 1
        d_i = ((i + 1) % segments) * 2
        faces.append((a, d_i, c, b))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    solid = obj.modifiers.new("LabelThickness", "SOLIDIFY")
    solid.thickness = mm(spec["label_thickness"])
    solid.offset = 1.0
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="LabelThickness")
    obj.select_set(False)
    return obj


def cap_profile(spec, d):
    r = spec["cap_r"]
    chamfer = spec["cap_chamfer"]
    z0 = d["z_cap0"]
    z1 = d["z_cap1"]
    core = 0.02
    return [
        (core, z0),
        (r, z0),
        (r, z1 - chamfer),
        (r - chamfer, z1),
        (core, z1),
    ]


def crimp_profile(spec, d):
    """Formed aluminum band around the bead — visible satin silver ring."""
    outer_r = spec["bead_r"] + spec["crimp_overhang"]
    inner_r = spec["neck_r"] - 0.06
    z0 = d["z_crimp0"]
    z1 = d["z_crimp1"]
    wall = 0.20
    return [
        (inner_r, z0 + 0.22),
        (outer_r - wall, z0),
        (outer_r, z0),
        (outer_r, z1),
        (outer_r - wall, z1),
        (inner_r, z1 - 0.14),
    ]


def stopper_profile(spec, d, neck_inner):
    r = neck_inner * 0.97
    z1 = d["z_bead"] + 0.40
    z0 = d["z_bead"] - spec["stopper_inset"]
    core = 0.02
    return [(core, z0), (r, z0), (r, z1), (core, z1)]


def build_master(capacity, spec, mats):
    d = derived(spec)
    prefix = f"VIAL_{capacity.upper()}"
    coll = ensure_collection(f"MASTER_{capacity.upper()}")
    segs = spec["segments"]

    g_profile, neck_inner = glass_profile(spec, d)
    glass = create_lathe(f"{prefix}_GLASS", g_profile, segs)
    assign(glass, mats["glass"])

    stopper = create_lathe(f"{prefix}_STOPPER", stopper_profile(spec, d, neck_inner), 64)
    assign(stopper, mats["stopper"])

    crimp = create_lathe(f"{prefix}_CRIMP", crimp_profile(spec, d), 96)
    assign(crimp, mats["crimp"])

    cap = create_lathe(f"{prefix}_CAP", cap_profile(spec, d), 96)
    assign(cap, mats["cap"])

    label = create_label_wrap(f"{prefix}_LABEL", spec, d)
    assign(label, mats["label"])

    cake = create_cake(f"{prefix}_CONTENT", spec, d, 96)
    assign(cake, mats["cake_white"])
    cake["ud_role"] = "cake"

    liquid = None
    if capacity == "10ml":
        cake.name = "CONTENT_10ML_CAKE"
        liquid = create_lathe("CONTENT_10ML_LIQUID", liquid_profile(spec, d), 96)
        assign(liquid, mats["liquid"])
        liquid.hide_render = True
        liquid.hide_viewport = True
        liquid["ud_role"] = "liquid"

    parts = {
        "glass": glass,
        "stopper": stopper,
        "crimp": crimp,
        "cap": cap,
        "label": label,
        "cake": cake,
        "liquid": liquid,
        "derived": d,
        "spec": spec,
        "collection": coll,
    }
    for obj in (glass, stopper, crimp, cap, label, cake, liquid):
        if obj is not None:
            link_exclusive(obj, coll)
    return parts


def linked_instance(obj, name, collection, location):
    dup = obj.copy()
    dup.data = obj.data
    dup.name = name
    dup.location = location
    collection.objects.link(dup)
    return dup


def instance_master(parts, capacity, contents, location, collection, mats):
    loc = Vector(location)
    inst = {}
    for key in ("glass", "stopper", "crimp", "cap", "label"):
        src = parts[key]
        inst[key] = linked_instance(src, f"{src.name}_{contents}", collection, loc)
        inst[key].hide_render = False
        inst[key].hide_viewport = False
    cake = linked_instance(parts["cake"], f"{parts['cake'].name}_{contents}", collection, loc)
    assign(cake, mats["cake_cobalt"] if contents == "cobalt_cake" else mats["cake_white"])
    cake.hide_render = contents == "red_liquid"
    cake.hide_viewport = contents == "red_liquid"
    inst["cake"] = cake
    if parts["liquid"] is not None:
        liquid = linked_instance(parts["liquid"], f"{parts['liquid'].name}_{contents}", collection, loc)
        show = contents == "red_liquid"
        liquid.hide_render = not show
        liquid.hide_viewport = not show
        inst["liquid"] = liquid
    return inst


def hide_from_camera(obj, *, transmission=True, glossy=True, diffuse=True, shadow=True):
    obj.visible_camera = False
    obj.visible_transmission = transmission
    obj.visible_glossy = glossy
    obj.visible_diffuse = diffuse
    obj.visible_shadow = shadow


def add_area(name, loc, energy, rot, size, collection, color=(1.0, 1.0, 1.0)):
    light = bpy.data.lights.new(name, type="AREA")
    light.shape = "RECTANGLE"
    light.size = size[0]
    light.size_y = size[1]
    light.energy = energy
    light.color = color
    obj = bpy.data.objects.new(name, light)
    collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    # Lights must not appear as glowing rectangles inside the glass.
    hide_from_camera(obj, transmission=False, glossy=True, diffuse=True, shadow=True)
    return obj


def add_reflection_card(name, loc, size_xy, rot, collection, color=(0.86, 0.86, 0.88)):
    mesh = bpy.data.meshes.new(name)
    w, h = size_xy
    verts = [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)]
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    mat, _n, _l, bsdf, _o = new_material(f"{name}Mat")
    set_input(bsdf, ["Base Color"], (*color, 1))
    set_input(bsdf, ["Roughness"], 0.48)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.04)
    assign(obj, mat)
    # Invisible to camera; still refracted/reflected so transparent glass reads.
    hide_from_camera(obj, transmission=True, glossy=True, diffuse=True, shadow=False)
    return obj


def add_floor_card(name, loc, radius, collection):
    mesh = bpy.data.meshes.new(name)
    segs = 32
    verts = [(0.0, 0.0, 0.0)]
    for i in range(segs):
        ang = (i / segs) * math.tau
        verts.append((radius * math.cos(ang), radius * math.sin(ang), 0.0))
    faces = [(0, i, i + 1 if i + 1 <= segs else 1) for i in range(1, segs + 1)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = loc
    mat, _n, _l, bsdf, _o = new_material(f"{name}Mat")
    set_input(bsdf, ["Base Color"], (0.74, 0.74, 0.76, 1))
    set_input(bsdf, ["Roughness"], 0.42)
    set_input(bsdf, ["Metallic"], 0.0)
    assign(obj, mat)
    hide_from_camera(obj, transmission=True, glossy=True, diffuse=True, shadow=False)
    return obj


def clear_collection(coll):
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def apply_light_linking(light_obj, receiver_coll):
    if receiver_coll is None or not hasattr(light_obj, "light_linking"):
        return
    try:
        light_obj.light_linking.receiver_collection = receiver_coll
    except Exception:
        pass


def setup_lights(center, radius, height, exclude_caps=None):
    coll = ensure_collection("LIGHTING_LOCKED")
    clear_collection(coll)
    cx, cy, cz = center
    body_h = height * 0.72
    body_z = cz + height * 0.38

    receivers = None
    if exclude_caps:
        receivers = ensure_collection("LIGHT_RECEIVERS_NO_CAP")
        clear_collection(receivers)
        for obj in exclude_caps:
            if obj is not None and "CAP" not in obj.name:
                try:
                    receivers.objects.link(obj)
                except RuntimeError:
                    pass

    rim_l = add_area(
        "RimLeft",
        loc=(cx - radius - mm(20), cy + mm(18), body_z),
        energy=22,
        rot=(math.radians(82), 0, math.radians(-16)),
        size=(mm(3.4), body_h),
        collection=coll,
    )
    rim_r = add_area(
        "RimRight",
        loc=(cx + radius + mm(20), cy + mm(16), body_z),
        energy=18,
        rot=(math.radians(82), 0, math.radians(16)),
        size=(mm(3.2), body_h * 0.95),
        collection=coll,
    )
    add_area(
        "CapKey",
        loc=(cx + mm(4), cy - mm(28), cz + height + mm(8)),
        energy=1.4,
        rot=(math.radians(58), 0, math.radians(6)),
        size=(radius * 0.9, mm(8)),
        collection=coll,
    )
    add_area(
        "SoftFill",
        loc=(cx, cy - mm(75), cz + height * 0.42),
        energy=11,
        rot=(math.radians(82), 0, 0),
        size=(radius * 2.8, height * 0.65),
        collection=coll,
    )
    add_area(
        "CakeKiss",
        loc=(cx + radius * 0.35, cy - mm(30), cz + mm(8)),
        energy=16,
        rot=(math.radians(68), 0, math.radians(-8)),
        size=(mm(24), mm(16)),
        collection=coll,
    )
    add_reflection_card(
        "CardLeft",
        loc=(cx - radius - mm(24), cy + mm(6), cz + height * 0.38),
        size_xy=(mm(8), height * 0.78),
        rot=(math.radians(90), 0, math.radians(-10)),
        collection=coll,
    )
    add_reflection_card(
        "CardRight",
        loc=(cx + radius + mm(24), cy + mm(6), cz + height * 0.38),
        size_xy=(mm(7), height * 0.74),
        rot=(math.radians(90), 0, math.radians(10)),
        collection=coll,
    )
    add_reflection_card(
        "CardBack",
        loc=(cx, cy + mm(36), cz + height * 0.40),
        size_xy=(radius * 3.2, height * 0.85),
        rot=(math.radians(90), 0, math.radians(180)),
        collection=coll,
        color=(0.80, 0.80, 0.82),
    )
    add_floor_card(
        "CardFloor",
        loc=(cx, cy, cz - mm(1.2)),
        radius=radius * 2.4,
        collection=coll,
    )
    apply_light_linking(rim_l, receivers)
    apply_light_linking(rim_r, receivers)
    return coll


def setup_camera(scene, look, distance, lens=135.0, sensor_fit="AUTO"):
    if "CAMERA_PRODUCT_LOCKED" in bpy.data.objects:
        cam = bpy.data.objects["CAMERA_PRODUCT_LOCKED"]
    else:
        cam_data = bpy.data.cameras.new("CAMERA_PRODUCT_LOCKED")
        cam = bpy.data.objects.new("CAMERA_PRODUCT_LOCKED", cam_data)
        bpy.context.scene.collection.objects.link(cam)
    cam.data.type = "PERSP"
    cam.data.lens = lens
    cam.data.sensor_width = 36
    cam.data.sensor_fit = sensor_fit
    cam.data.clip_start = 0.01
    cam.data.clip_end = 4.0
    cam.location = (look[0], look[1] - distance, look[2])
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    scene.camera = cam
    return cam


def world_bounds(objects):
    xs, zs = [], []
    for obj in objects:
        if obj.hide_render:
            continue
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            xs.append(world.x)
            zs.append(world.z)
    if not xs:
        return 0.0, 0.0, 0.0, 0.0
    return min(xs), max(xs), min(zs), max(zs)


def frame_subject(scene, look, width_mm, height_mm, resolution, padding=1.28):
    """Place a 135 mm camera so the subject fits the frame at true scale."""
    sensor = 36.0
    lens = 135.0
    aspect = resolution[0] / resolution[1]
    frame_h = height_mm * padding
    frame_w = width_mm * padding
    if aspect >= 1.0:
        dist_w = (frame_w * lens) / sensor
        dist_h = (frame_h * lens * aspect) / sensor
    else:
        dist_h = (frame_h * lens) / sensor
        dist_w = (frame_w * lens) / (sensor * aspect)
    distance = mm(max(dist_h, dist_w))
    sensor_fit = "HORIZONTAL" if aspect >= 1.0 else "VERTICAL"
    return setup_camera(scene, look, distance, lens=lens, sensor_fit=sensor_fit)


def configure_render(scene, size, samples):
    scene.render.resolution_x = size[0]
    scene.render.resolution_y = size[1]
    scene.render.resolution_percentage = 100
    scene.cycles.samples = samples
    scene.render.threads_mode = "AUTO"


def hide_masters(masters, hide):
    for parts in masters.values():
        for obj in parts["collection"].objects:
            obj.hide_render = hide
            obj.hide_viewport = hide


def set_master_contents(parts, contents, mats):
    assign(parts["cake"], mats["cake_cobalt"] if contents == "cobalt_cake" else mats["cake_white"])
    show_cake = contents != "red_liquid"
    parts["cake"].hide_render = not show_cake
    parts["cake"].hide_viewport = not show_cake
    if parts["liquid"] is not None:
        show_liq = contents == "red_liquid"
        parts["liquid"].hide_render = not show_liq
        parts["liquid"].hide_viewport = not show_liq


def render_still(scene, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print(f"Wrote {path}")


def write_checker_composite(src_path, dst_path, cell=18):
    """Composite a transparent comparison over a light-gray checker. Diagnostic only."""
    src_path = Path(src_path)
    dst_path = Path(dst_path)
    try:
        from PIL import Image
    except ImportError:
        Image = None

    if Image is not None:
        im = Image.open(src_path).convert("RGBA")
        w, h = im.size
        checker = Image.new("RGBA", (w, h))
        light = (199, 199, 201, 255)
        dark = (178, 178, 181, 255)
        pix = checker.load()
        for y in range(h):
            for x in range(w):
                pix[x, y] = light if ((x // cell) + (y // cell)) % 2 == 0 else dark
        out = Image.alpha_composite(checker, im)
        out.save(dst_path)
        print(f"Wrote {dst_path}")
        return

    try:
        import numpy as np
    except ImportError:
        np = None

    img = bpy.data.images.load(str(src_path), check_existing=False)
    w, h = img.size
    if np is None:
        raise RuntimeError("Need Pillow or numpy to write the checker comparison")
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    yy, xx = np.indices((h, w))
    flag = ((xx // cell) + (yy // cell)) % 2
    light = np.array([0.78, 0.78, 0.79], dtype=np.float32)
    dark = np.array([0.70, 0.70, 0.71], dtype=np.float32)
    bg = np.where(flag[..., None] == 0, light, dark)
    a = px[..., 3:4]
    rgb = px[..., :3] * a + bg * (1.0 - a)
    rgba = np.concatenate([rgb, np.ones((h, w, 1), dtype=np.float32)], axis=2)
    dest = bpy.data.images.new("preview_comparison_checker", w, h, alpha=True)
    dest.pixels.foreach_set(rgba.ravel())
    dest.filepath_raw = str(dst_path)
    dest.file_format = "PNG"
    dest.save()
    print(f"Wrote {dst_path}")


def measurement_report(masters):
    report = {"vial_specs_mm": VIAL_SPECS, "derived_mm": {}}
    for key, parts in masters.items():
        d = parts["derived"]
        report["derived_mm"][key] = {
            "labelable_body_bottom_z": d["labelable_body_bottom_z"],
            "labelable_body_top_z": d["labelable_body_top_z"],
            "labelable_body_height": d["labelable_body_height"],
            "label_height": d["label_height"],
            "label_bottom_z": d["label_bottom_z"],
            "label_top_z": d["label_top_z"],
            "expose_above_frac": d["expose_frac"],
            "expose_below_frac": d["expose_frac"],
            "internal_bottom_z": d["internal_bottom_z"],
            "internal_top_z": d["internal_top_z"],
            "internal_chamber_height": d["internal_chamber_height"],
            "fill_75_z": d["fill_75_z"],
            "liquid_vs_label": d["liquid_vs_label"],
            "cake_h": d["cake_h"],
            "liquid_h": d["liquid_h"],
            "total_glass_h": d["total_glass_h"],
            "total_assembly_h": d["total_assembly_h"],
            "r_outer": parts["spec"]["r_outer"],
            "r_inner": d["r_inner"],
        }
    return report


def print_review_block(report):
    print("\n======== ITERATION 3 REVIEW BLOCK ========")
    for key in ("3ml", "5ml", "10ml"):
        print(f"\nVIAL_SPECS[{key!r}] =")
        print(json.dumps(report["vial_specs_mm"][key], indent=2))
    d10 = report["derived_mm"]["10ml"]
    print("\n10 mL chamber / label Z (mm):")
    print(json.dumps(
        {
            "internal_bottom_z": d10["internal_bottom_z"],
            "internal_top_z": d10["internal_top_z"],
            "internal_chamber_height": d10["internal_chamber_height"],
            "75_percent_fill_z": d10["fill_75_z"],
            "label_bottom_z": d10["label_bottom_z"],
            "label_top_z": d10["label_top_z"],
            "liquid_vs_label": d10["liquid_vs_label"],
        },
        indent=2,
    ))
    print("==========================================\n")


def main():
    args = parse_args()
    scene = reset_scene()
    mats = build_materials()
    masters = {
        key: build_master(key, spec, mats)
        for key, spec in VIAL_SPECS.items()
    }

    report = measurement_report(masters)
    report_path = RENDERS_DIR / "preview-measurements.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["derived_mm"], indent=2))
    print_review_block(report)

    if not args.skip_render:
        configure_render(scene, PREVIEW_SIZE, args.samples)
        hide_masters(masters, False)
        for variant in PREVIEW_VARIANTS:
            for other_key, other in masters.items():
                hide = other_key != variant["capacity"]
                for obj in other["collection"].objects:
                    obj.hide_render = hide
                    obj.hide_viewport = hide
            parts = masters[variant["capacity"]]
            set_master_contents(parts, variant["contents"], mats)
            d = parts["derived"]
            look = (0.0, 0.0, mm(d["total_assembly_h"] * 0.50))
            frame_subject(
                scene,
                look,
                width_mm=parts["spec"]["r_outer"] * 2,
                height_mm=d["total_assembly_h"],
                resolution=PREVIEW_SIZE,
                padding=1.42,
            )
            setup_lights(
                center=(0.0, 0.0, 0.0),
                radius=mm(parts["spec"]["r_outer"]),
                height=mm(d["total_assembly_h"]),
                exclude_caps=list(parts["collection"].objects),
            )
            bpy.context.view_layer.update()
            render_still(scene, RENDERS_DIR / variant["file"])

        cmp = ensure_collection("COMPARISON_PREVIEW")
        clear_collection(cmp)
        cursor = 0.0
        placed = []
        gap = 10.0
        for variant in PREVIEW_VARIANTS:
            spec = VIAL_SPECS[variant["capacity"]]
            if placed:
                prev_r = VIAL_SPECS[placed[-1]["capacity"]]["r_outer"]
                cursor += prev_r + spec["r_outer"] + gap
            placed.append({**variant, "x": cursor})
        group_width = placed[-1]["x"] + VIAL_SPECS[placed[-1]["capacity"]]["r_outer"]
        offset = group_width / 2.0
        for item in placed:
            x = mm(item["x"] - offset)
            instance_master(
                masters[item["capacity"]],
                item["capacity"],
                item["contents"],
                (x, 0.0, 0.0),
                cmp,
                mats,
            )
        hide_masters(masters, True)
        bpy.context.view_layer.update()
        min_x, max_x, min_z, max_z = world_bounds(cmp.objects)
        width_m = max(max_x - min_x, mm(20))
        height_m = max(max_z - min_z, mm(20))
        look = ((min_x + max_x) * 0.5, 0.0, (min_z + max_z) * 0.50)
        frame_subject(
            scene,
            look,
            width_mm=width_m / MM,
            height_mm=height_m / MM,
            resolution=COMPARISON_SIZE,
            padding=1.55,
        )
        setup_lights(
            center=(look[0], 0.0, 0.0),
            radius=width_m * 0.38,
            height=height_m,
            exclude_caps=list(cmp.objects),
        )
        print(
            json.dumps(
                {
                    "comparison_bounds_m": [min_x, max_x, min_z, max_z],
                    "comparison_look": list(look),
                }
            )
        )
        configure_render(scene, COMPARISON_SIZE, args.samples)
        bpy.context.view_layer.update()
        comparison_path = RENDERS_DIR / "preview-comparison.png"
        render_still(scene, comparison_path)
        write_checker_composite(comparison_path, RENDERS_DIR / "preview-comparison-checker.png")

        hide_masters(masters, False)
        for parts in masters.values():
            set_master_contents(parts, "white_cake", mats)
        for obj in cmp.objects:
            obj.hide_render = True
            obj.hide_viewport = True

    blend_path = MASTERS_DIR / "vial-master.blend"
    blend_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f"Wrote {blend_path}")


if __name__ == "__main__":
    main()
