#!/usr/bin/env python3
"""
Build three locked pharmaceutical vial masters in Blender 5.2 / Cycles.

Capacities: 3 mL, 5 mL, 10 mL. Contents are variants of those masters.
30 mL is not built in this pass.

All millimeter dimensions live in VIAL_SPECS. Derived label math is computed
from those specs only. Do not invoke this file with system Python.
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
# ---------------------------------------------------------------------------
VIAL_SPECS = {
    "3ml": {
        "capacity_ml": 3,
        "r_outer": 8.30,          # 16.6 mm OD
        "wall": 1.00,
        "heel": 1.50,
        "body_bottom_z": 2.30,    # start of full-diameter straight wall
        "body_top_z": 24.50,      # end of straight wall / start of shoulder
        "shoulder_h": 4.20,
        "neck_r": 5.45,
        "neck_h": 5.60,
        "bead_r": 6.55,           # 13 mm finish
        "bead_h": 1.35,
        "lip_h": 1.00,
        "floor": 2.10,            # inner cavity floor (heavy bottom)
        "cake_fill": 0.20,
        "liquid_fill": 0.75,
        "cap_r": 6.75,
        "cap_h": 2.05,
        "cap_chamfer": 0.16,
        "crimp_h": 4.70,
        "crimp_overhang": 0.35,
        "stopper_inset": 3.20,
        "label_frac": 0.80,       # 10 / 80 / 10
        "label_clearance": 0.07,
        "label_thickness": 0.05,
        "segments": 128,
    },
    "5ml": {
        "capacity_ml": 5,
        "r_outer": 11.00,         # 22.0 mm OD
        "wall": 1.10,
        "heel": 1.70,
        "body_bottom_z": 2.70,
        "body_top_z": 29.60,
        "shoulder_h": 4.80,
        "neck_r": 8.15,
        "neck_h": 6.10,
        "bead_r": 9.85,           # 20 mm finish
        "bead_h": 1.50,
        "lip_h": 1.10,
        "floor": 2.40,
        "cake_fill": 0.20,
        "liquid_fill": 0.75,
        "cap_r": 10.15,
        "cap_h": 2.20,
        "cap_chamfer": 0.18,
        "crimp_h": 5.40,
        "crimp_overhang": 0.40,
        "stopper_inset": 3.60,
        "label_frac": 0.80,       # 10 / 80 / 10
        "label_clearance": 0.07,
        "label_thickness": 0.05,
        "segments": 128,
    },
    "10ml": {
        "capacity_ml": 10,
        "r_outer": 12.05,         # 24.1 mm OD
        "wall": 1.20,
        "heel": 1.90,
        "body_bottom_z": 3.10,
        "body_top_z": 40.20,
        "shoulder_h": 5.40,
        "neck_r": 8.35,
        "neck_h": 6.50,
        "bead_r": 10.05,          # 20 mm finish
        "bead_h": 1.55,
        "lip_h": 1.15,
        "floor": 2.70,
        "cake_fill": 0.20,
        "liquid_fill": 0.75,
        "cap_r": 10.25,
        "cap_h": 2.25,
        "cap_chamfer": 0.18,
        "crimp_h": 5.60,
        "crimp_overhang": 0.40,
        "stopper_inset": 3.80,
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
    chamber_h = body_top - spec["floor"]
    cake_h = chamber_h * spec["cake_fill"]
    liquid_h = chamber_h * spec["liquid_fill"]
    # Thin visible aluminum band, then a single flat flip-off. Body/label math
    # is unchanged; only the closure stack is tightened.
    z_crimp0 = z_bead - 0.12
    z_crimp1 = z_bead + min(spec["crimp_h"] * 0.42, 2.25)
    z_cap0 = z_crimp1 - 0.06
    z_cap1 = z_cap0 + spec["cap_h"]
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
        "chamber_h": chamber_h,
        "cake_h": cake_h,
        "liquid_h": liquid_h,
        "total_glass_h": z_top,
        "total_assembly_h": z_cap1,
    }


def smooth_steps(a, b, count):
    out = []
    for i in range(count):
        t = i / (count - 1)
        s = t * t * (3.0 - 2.0 * t)
        out.append((a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s))
    return out


def shoulder_curve(a, b, count):
    """Rounded pharmaceutical shoulder: stay wide, then flow into the neck."""
    out = []
    for i in range(count):
        t = i / (count - 1)
        s = t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
        r_t = s ** 1.65
        out.append((a[0] + (b[0] - a[0]) * r_t, a[1] + (b[1] - a[1]) * s))
    return out


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
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.12, 0.12, 0.125, 1)
    bg.inputs["Strength"].default_value = 0.35
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
    for poly in obj.data.polygons:
        poly.use_smooth = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)
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
    vol.inputs["Density"].default_value = 0.08
    links.new(vol.outputs["Volume"], out.inputs["Volume"])
    mats["glass"] = glass

    stopper, _n, _l, bsdf, _o = new_material("MAT_STOPPER_GRAY")
    set_input(bsdf, ["Base Color"], (0.16, 0.16, 0.17, 1))
    set_input(bsdf, ["Roughness"], 0.78)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.08)
    set_input(bsdf, ["Coat Weight"], 0.0)
    set_input(bsdf, ["Emission Strength"], 0.0)
    mats["stopper"] = stopper

    crimp, nodes, links, bsdf, _o = new_material("MAT_CRIMP_SILVER")
    set_input(bsdf, ["Base Color"], (0.36, 0.37, 0.39, 1))
    set_input(bsdf, ["Metallic"], 1.0)
    set_input(bsdf, ["Roughness"], 0.48)
    set_input(bsdf, ["Anisotropic Weight", "Anisotropic"], 0.55)
    set_input(bsdf, ["Anisotropic Rotation"], 0.25)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.35)
    set_input(bsdf, ["Coat Weight"], 0.0)
    tex = nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 220
    tex.inputs["Detail"].default_value = 6
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06
    links.new(tex.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["crimp"] = crimp

    cap, _n, _l, bsdf, _o = new_material("MAT_CAP_BLACK")
    set_input(bsdf, ["Base Color"], (0.004, 0.004, 0.005, 1))
    set_input(bsdf, ["Roughness"], 0.88)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.03)
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

    def cake_mat(name, color, emit_strength):
        mat, nodes, links, bsdf, out = new_material(name)
        set_input(bsdf, ["Base Color"], color)
        set_input(bsdf, ["Roughness"], 0.78)
        set_input(bsdf, ["Specular IOR Level", "Specular"], 0.04)
        set_input(bsdf, ["Subsurface Weight", "Subsurface"], 0.35)
        set_input(bsdf, ["Subsurface Radius"], (0.35, 0.22, 0.14))
        set_input(bsdf, ["Subsurface Scale"], 0.06)
        set_input(bsdf, ["Metallic"], 0.0)
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 120
        noise.inputs["Detail"].default_value = 12
        noise.inputs["Roughness"].default_value = 0.35
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.12
        bump.inputs["Distance"].default_value = mm(0.035)
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        emit = nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = color
        emit.inputs["Strength"].default_value = emit_strength
        mix = nodes.new("ShaderNodeMixShader")
        mix.inputs["Fac"].default_value = 0.28
        links.new(bsdf.outputs["BSDF"], mix.inputs[1])
        links.new(emit.outputs["Emission"], mix.inputs[2])
        links.new(mix.outputs["Shader"], out.inputs["Surface"])
        return mat

    mats["cake_white"] = cake_mat("MAT_CAKE_WHITE", (0.96, 0.95, 0.93, 1), 0.55)
    mats["cake_cobalt"] = cake_mat("MAT_CAKE_COBALT", (0.03, 0.14, 0.58, 1), 0.45)

    liquid, nodes, links, bsdf, out = new_material("MAT_LIQUID_RED")
    set_input(bsdf, ["Base Color"], (0.28, 0.01, 0.04, 1))
    set_input(bsdf, ["Roughness"], 0.0)
    set_input(bsdf, ["Transmission Weight", "Transmission"], 1.0)
    set_input(bsdf, ["IOR"], 1.333)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.35)
    vol = nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = (0.22, 0.01, 0.035, 1)
    vol.inputs["Density"].default_value = 1.15
    links.new(vol.outputs["Volume"], out.inputs["Volume"])
    mats["liquid"] = liquid
    return mats


def glass_profile(spec, d):
    r_out = spec["r_outer"]
    r_in = d["r_inner"]
    heel = spec["heel"]
    body_top = spec["body_top_z"]
    body_bottom = spec["body_bottom_z"]
    neck_r = spec["neck_r"]
    neck_inner = neck_r - spec["wall"] * 0.90
    bead_r = spec["bead_r"]
    bead_h = spec["bead_h"]
    floor = spec["floor"]
    z_neck = d["z_neck"]
    z_bead = d["z_bead"]
    z_lip = d["z_lip"]
    z_top = d["z_top"]

    outer = [
        (0.0, 0.16),
        (r_out * 0.40, 0.05),
        (r_out - heel * 0.75, 0.0),
        (r_out, body_bottom),
        (r_out, body_top),
    ]
    outer += shoulder_curve((r_out, body_top), (neck_r, z_neck), 22)[1:]
    outer += [
        (neck_r, z_bead),
        (bead_r, z_bead + bead_h * 0.38),
        (bead_r, z_lip),
        (neck_r + 0.12, z_top),
        (neck_inner, z_top),
        (neck_inner, z_bead),
    ]
    inner = list(reversed(shoulder_curve((r_in, body_top + 0.12), (neck_inner, z_neck), 16)))[1:]
    inner += [
        (r_in, body_top),
        (r_in, floor),
        (r_in * 0.52, floor * 0.90),
        (0.0, floor * 0.86),
    ]
    return outer + inner, neck_inner


def cake_profile(spec, d):
    r = d["r_inner"] - 0.05
    z0 = spec["floor"] + 0.04
    z1 = z0 + d["cake_h"]
    core = 0.03
    profile = [(core, z0), (r, z0), (r, z1)]
    for i in range(1, 8):
        t = i / 7
        rr = r * (1.0 - t)
        dip = 0.10 * (1.0 - (max(rr, core) / r) ** 2)
        profile.append((max(rr, core), z1 - dip))
    return profile


def liquid_profile(spec, d):
    r = d["r_inner"] - 0.05
    z0 = spec["floor"] + 0.04
    z1 = spec["floor"] + d["liquid_h"]
    core = 0.03
    meniscus = 0.45
    profile = [(core, z0), (r, z0), (r, z1)]
    for i in range(1, 10):
        t = i / 9
        rr = r * (1.0 - t)
        dip = meniscus * (1.0 - (max(rr, core) / r) ** 2)
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
    r = spec["bead_r"] + 0.22
    chamfer = 0.10
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
    """Thin formed aluminum band around the bead — not a solid stacked disc."""
    outer_r = spec["bead_r"] + 0.10
    inner_r = spec["neck_r"] - 0.08
    z0 = d["z_crimp0"]
    z1 = d["z_crimp1"]
    wall = 0.18
    return [
        (inner_r, z0 + 0.20),
        (outer_r - wall, z0),
        (outer_r, z0),
        (outer_r, z1),
        (outer_r - wall, z1),
        (inner_r, z1 - 0.12),
    ]


def stopper_profile(spec, d, neck_inner):
    r = neck_inner * 0.97
    z1 = d["z_bead"] + 0.35
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

    cake = create_lathe(f"{prefix}_CONTENT", cake_profile(spec, d), 96)
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


def hide_from_camera_and_transmission(obj):
    obj.visible_camera = False
    obj.visible_transmission = False
    obj.visible_glossy = True
    obj.visible_diffuse = True
    obj.visible_shadow = True


def add_area(name, loc, energy, rot, size, collection):
    light = bpy.data.lights.new(name, type="AREA")
    light.shape = "RECTANGLE"
    light.size = size[0]
    light.size_y = size[1]
    light.energy = energy
    light.color = (1.0, 1.0, 1.0)
    obj = bpy.data.objects.new(name, light)
    collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    hide_from_camera_and_transmission(obj)
    return obj


def add_reflection_card(name, loc, size_xy, rot, collection):
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
    set_input(bsdf, ["Base Color"], (0.82, 0.82, 0.83, 1))
    set_input(bsdf, ["Roughness"], 0.55)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.04)
    assign(obj, mat)
    hide_from_camera_and_transmission(obj)
    return obj


def clear_collection(coll):
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def setup_lights(center, radius, height):
    coll = ensure_collection("LIGHTING_LOCKED")
    clear_collection(coll)
    cx, cy, cz = center
    add_area(
        "RimLeft",
        loc=(cx - radius - mm(18), cy + mm(22), cz + height * 0.42),
        energy=38,
        rot=(math.radians(82), 0, math.radians(-18)),
        size=(mm(3.2), height * 0.95),
        collection=coll,
    )
    add_area(
        "RimRight",
        loc=(cx + radius + mm(18), cy + mm(20), cz + height * 0.40),
        energy=32,
        rot=(math.radians(82), 0, math.radians(18)),
        size=(mm(3.0), height * 0.90),
        collection=coll,
    )
    add_area(
        "CapKey",
        loc=(cx + mm(6), cy - mm(24), cz + height + mm(10)),
        energy=2.2,
        rot=(math.radians(55), 0, math.radians(8)),
        size=(radius * 1.1, mm(10)),
        collection=coll,
    )
    add_area(
        "SoftFill",
        loc=(cx, cy - mm(70), cz + height * 0.45),
        energy=9,
        rot=(math.radians(82), 0, 0),
        size=(radius * 2.6, height * 0.7),
        collection=coll,
    )
    add_area(
        "CakeKiss",
        loc=(cx + radius * 0.4, cy - mm(28), cz + mm(6)),
        energy=14,
        rot=(math.radians(70), 0, math.radians(-8)),
        size=(mm(22), mm(14)),
        collection=coll,
    )
    add_reflection_card(
        "CardLeft",
        loc=(cx - radius - mm(22), cy + mm(8), cz + height * 0.40),
        size_xy=(mm(6), height * 0.85),
        rot=(math.radians(90), 0, math.radians(-12)),
        collection=coll,
    )
    add_reflection_card(
        "CardRight",
        loc=(cx + radius + mm(22), cy + mm(8), cz + height * 0.40),
        size_xy=(mm(5.5), height * 0.80),
        rot=(math.radians(90), 0, math.radians(12)),
        collection=coll,
    )
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
    # AUTO sensor fit maps sensor_width to the longer frame axis.
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
            "cake_h": d["cake_h"],
            "liquid_h": d["liquid_h"],
            "chamber_h": d["chamber_h"],
            "total_glass_h": d["total_glass_h"],
            "total_assembly_h": d["total_assembly_h"],
            "r_outer": parts["spec"]["r_outer"],
            "r_inner": d["r_inner"],
        }
    return report


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
            )
            bpy.context.view_layer.update()
            render_still(scene, RENDERS_DIR / variant["file"])

        # Comparison: linked instances, true relative scale, shared baseline z=0.
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
        tallest = max(masters[v["capacity"]]["derived"]["total_assembly_h"] for v in placed)
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
        render_still(scene, RENDERS_DIR / "preview-comparison.png")

        # Restore masters visible for the saved .blend
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
