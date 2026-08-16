#!/usr/bin/env python3
"""
Single-vial development master: 3 mL white cake.

Rebuilds the glass from a 2D lathe profile and matches
tools/blender-vials/references/image-gen-3ml White.png.

Renders only:
  renders/3ml-white-studio.png
  renders/3ml-white-transparent.png

Do not invoke this file with system Python.
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
REF_PATH = TOOL_ROOT / "references" / "image-gen-3ml White.png"
RENDERS_DIR = TOOL_ROOT / "renders"
MASTERS_DIR = TOOL_ROOT / "masters"

MM = 0.001

# ---------------------------------------------------------------------------
# 3 mL Type I serum vial, parameterized in millimeters.
# Tuned to overlay the approved 3 mL white reference silhouette.
# ---------------------------------------------------------------------------
SPEC = {
    "r_outer": 8.40,          # 16.8 mm OD
    "wall": 1.15,
    "heel_r": 1.90,
    "body_h": 23.80,          # straight cylindrical wall
    "shoulder_h": 6.40,       # smooth pharmaceutical fillet
    "neck_r": 5.15,           # 10.3 mm neck tube
    "neck_h": 4.70,
    "bead_r": 6.55,           # 13.1 mm finish
    "bead_h": 1.50,
    "lip_h": 0.70,
    "floor": 3.50,            # inner cavity floor (heavy bottom)
    "inner_fillet": 1.55,
    "inner_dish": 0.30,
    # Label: large wrap, down toward the base, glass remaining under the shoulder.
    "label_gap_bottom": 1.20,
    "label_gap_top": 5.10,
    "label_clearance": 0.06,
    "label_thickness": 0.05,
    "cap_r": 6.95,
    "cap_h": 3.40,
    "cap_chamfer": 0.24,
    "crimp_h": 2.40,
    "crimp_overhang": 0.18,
    "stopper_inset": 3.70,
    "cake_frac": 0.22,
    "segments": 192,
}

RENDER_SIZE = (1024, 1280)
RENDER_SAMPLES = 96


def argv_after_double_dash():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1 :]
    return []


def parse_args():
    parser = argparse.ArgumentParser(description="Build the 3 mL white development master")
    parser.add_argument("--samples", type=int, default=RENDER_SAMPLES)
    parser.add_argument("--skip-render", action="store_true")
    return parser.parse_args(argv_after_double_dash())


def mm(value):
    return value * MM


def derived(spec):
    body_bottom = spec["heel_r"]
    body_top = body_bottom + spec["body_h"]
    z_neck = body_top + spec["shoulder_h"]
    z_bead = z_neck + spec["neck_h"]
    z_lip = z_bead + spec["bead_h"]
    z_top = z_lip + spec["lip_h"]
    r_inner = spec["r_outer"] - spec["wall"]
    neck_inner = spec["neck_r"] - spec["wall"] * 0.88
    internal_bottom = spec["floor"]
    internal_top = z_neck
    chamber = internal_top - internal_bottom
    label_bottom = body_bottom + spec["label_gap_bottom"]
    label_top = body_top - spec["label_gap_top"]
    z_crimp0 = z_bead - 0.20
    z_crimp1 = z_crimp0 + spec["crimp_h"]
    z_cap0 = z_crimp1 - 0.08
    z_cap1 = z_cap0 + spec["cap_h"]
    return {
        "body_bottom_z": body_bottom,
        "body_top_z": body_top,
        "z_neck": z_neck,
        "z_bead": z_bead,
        "z_lip": z_lip,
        "z_top": z_top,
        "r_inner": r_inner,
        "neck_inner": neck_inner,
        "internal_bottom_z": internal_bottom,
        "internal_top_z": internal_top,
        "internal_chamber_height": chamber,
        "cake_h": chamber * spec["cake_frac"],
        "label_bottom_z": label_bottom,
        "label_top_z": label_top,
        "z_crimp0": z_crimp0,
        "z_crimp1": z_crimp1,
        "z_cap0": z_cap0,
        "z_cap1": z_cap1,
        "total_assembly_h": z_cap1,
        "od": spec["r_outer"] * 2.0,
    }


def shoulder_pts(r0, z0, r1, z1, count):
    """Vertical-to-vertical pharmaceutical fillet. No cone, no sharp break."""
    out = []
    for i in range(count):
        t = i / (count - 1)
        s = 0.5 * (1.0 - math.cos(math.pi * t))
        out.append((r0 + (r1 - r0) * s, z0 + (z1 - z0) * t))
    return out


def heel_pts(r_out, heel, count=14):
    pts = []
    for i in range(count):
        t = i / (count - 1)
        ang = t * (math.pi * 0.5)
        pts.append((r_out - heel + heel * math.sin(ang), heel - heel * math.cos(ang)))
    return pts


def inner_floor_pts(spec, d):
    r_in = d["r_inner"]
    floor = spec["floor"]
    fillet = spec["inner_fillet"]
    dish = spec["inner_dish"]
    pts = []
    for i in range(10):
        t = i / 9
        ang = t * (math.pi * 0.5)
        pts.append((r_in - fillet + fillet * math.cos(ang), floor + fillet - fillet * math.sin(ang)))
    pts += [
        (r_in * 0.58, floor - dish * 0.30),
        (r_in * 0.26, floor - dish * 0.82),
        (0.0, floor - dish),
    ]
    return pts


def glass_profile(spec, d):
    r_out = spec["r_outer"]
    r_in = d["r_inner"]
    heel = spec["heel_r"]
    body_top = d["body_top_z"]
    body_bottom = d["body_bottom_z"]
    neck_r = spec["neck_r"]
    neck_inner = d["neck_inner"]
    bead_r = spec["bead_r"]
    bead_h = spec["bead_h"]
    z_neck = d["z_neck"]
    z_bead = d["z_bead"]
    z_lip = d["z_lip"]
    z_top = d["z_top"]

    outer = [
        (0.0, 0.16),
        (r_out * 0.36, 0.04),
        (r_out - heel, 0.0),
    ]
    outer += heel_pts(r_out, heel, 16)[1:]
    if body_bottom > heel + 0.04:
        outer.append((r_out, body_bottom))
    outer.append((r_out, body_top))
    outer += shoulder_pts(r_out, body_top, neck_r, z_neck, 36)[1:]
    outer += [
        (neck_r, z_bead),
        (bead_r, z_bead + bead_h * 0.42),
        (bead_r, z_lip),
        (neck_r + 0.10, z_top),
        (neck_inner, z_top),
        (neck_inner, z_bead),
    ]
    inner = list(reversed(shoulder_pts(r_in, body_top, neck_inner, z_neck, 28)))[1:]
    inner += [(r_in, body_top)]
    inner += inner_floor_pts(spec, d)
    return outer + inner


def cap_profile(spec, d):
    r = spec["cap_r"]
    ch = spec["cap_chamfer"]
    return [
        (0.02, d["z_cap0"]),
        (r, d["z_cap0"]),
        (r, d["z_cap1"] - ch),
        (r - ch, d["z_cap1"]),
        (0.02, d["z_cap1"]),
    ]


def crimp_profile(spec, d):
    outer_r = spec["bead_r"] + spec["crimp_overhang"]
    inner_r = spec["neck_r"] - 0.05
    z0, z1 = d["z_crimp0"], d["z_crimp1"]
    return [
        (inner_r, z0 + 0.22),
        (outer_r - 0.18, z0),
        (outer_r, z0),
        (outer_r, z1),
        (outer_r - 0.18, z1),
        (inner_r, z1 - 0.14),
    ]


def stopper_profile(spec, d):
    r = d["neck_inner"] * 0.96
    z1 = d["z_bead"] + 0.38
    z0 = d["z_bead"] - spec["stopper_inset"]
    return [(0.02, z0), (r, z0), (r, z1), (0.02, z1)]


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
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.max_bounces = 18
    scene.cycles.transparent_max_bounces = 18
    scene.cycles.transmission_bounces = 18
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 8
    scene.cycles.volume_bounces = 2
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    if hasattr(scene.cycles, "blur_glossy"):
        scene.cycles.blur_glossy = 0.45
    elif hasattr(scene.cycles, "filter_glossy"):
        scene.cycles.filter_glossy = 0.45
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 8
    scene.render.dither_intensity = 1.0
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0.15
    scene.view_settings.gamma = 1.0
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.78, 0.79, 0.81, 1)
    bg.inputs["Strength"].default_value = 0.42
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


def create_lathe(name, profile_mm, segments):
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

    glass, nodes, links, bsdf, out = new_material("MAT_GLASS")
    set_input(bsdf, ["Base Color"], (0.995, 0.997, 1.0, 1))
    set_input(bsdf, ["Roughness"], 0.0)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["IOR"], 1.47)
    set_input(bsdf, ["Transmission Weight", "Transmission"], 1.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.5)
    set_input(bsdf, ["Coat Weight"], 0.0)
    vol = nodes.new("ShaderNodeVolumeAbsorption")
    vol.inputs["Color"].default_value = (0.98, 0.985, 0.99, 1)
    vol.inputs["Density"].default_value = 1.2
    links.new(vol.outputs["Volume"], out.inputs["Volume"])
    mats["glass"] = glass

    stopper, _n, _l, bsdf, _o = new_material("MAT_STOPPER")
    set_input(bsdf, ["Base Color"], (0.34, 0.34, 0.35, 1))
    set_input(bsdf, ["Roughness"], 0.84)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.05)
    set_input(bsdf, ["Emission Strength"], 0.0)
    mats["stopper"] = stopper

    crimp, nodes, links, bsdf, _o = new_material("MAT_CRIMP")
    set_input(bsdf, ["Base Color"], (0.56, 0.57, 0.59, 1))
    set_input(bsdf, ["Metallic"], 1.0)
    set_input(bsdf, ["Roughness"], 0.34)
    set_input(bsdf, ["Anisotropic Weight", "Anisotropic"], 0.68)
    set_input(bsdf, ["Anisotropic Rotation"], 0.25)
    set_input(bsdf, ["Coat Weight"], 0.0)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 280
    noise.inputs["Detail"].default_value = 6
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.045
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["crimp"] = crimp

    cap, nodes, links, bsdf, out = new_material("MAT_CAP")
    nodes.remove(bsdf)
    diff = nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value = (0.018, 0.018, 0.019, 1)
    if "Roughness" in diff.inputs:
        diff.inputs["Roughness"].default_value = 0.88
    links.new(diff.outputs["BSDF"], out.inputs["Surface"])
    mats["cap"] = cap

    label, nodes, links, bsdf, _o = new_material("MAT_LABEL")
    set_input(bsdf, ["Base Color"], (0.94, 0.94, 0.93, 1))
    set_input(bsdf, ["Roughness"], 0.66)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.06)
    set_input(bsdf, ["Emission Strength"], 0.0)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 220
    noise.inputs["Detail"].default_value = 8
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.02
    bump.inputs["Distance"].default_value = mm(0.03)
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["label"] = label

    cake, nodes, links, bsdf, _o = new_material("MAT_CAKE")
    set_input(bsdf, ["Base Color"], (0.95, 0.945, 0.93, 1))
    set_input(bsdf, ["Roughness"], 0.88)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.025)
    set_input(bsdf, ["Subsurface Weight", "Subsurface"], 0.20)
    set_input(bsdf, ["Subsurface Radius"], (0.38, 0.26, 0.18))
    set_input(bsdf, ["Subsurface Scale"], 0.0020)
    set_input(bsdf, ["Emission Strength"], 0.0)
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 480
    noise.inputs["Detail"].default_value = 14
    noise.inputs["Roughness"].default_value = 0.58
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.20
    bump.inputs["Distance"].default_value = mm(0.025)
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["cake"] = cake

    studio, _n, _l, bsdf, _o = new_material("MAT_STUDIO")
    set_input(bsdf, ["Base Color"], (0.84, 0.845, 0.85, 1))
    set_input(bsdf, ["Roughness"], 0.62)
    set_input(bsdf, ["Metallic"], 0.0)
    set_input(bsdf, ["Specular IOR Level", "Specular"], 0.04)
    mats["studio"] = studio
    return mats


def create_label(name, spec, d):
    radius = mm(spec["r_outer"] + spec["label_clearance"])
    z0 = mm(d["label_bottom_z"])
    z1 = mm(d["label_top_z"])
    segments = spec["segments"]
    verts = []
    for i in range(segments):
        angle = (i / segments) * math.tau
        verts.append((radius * math.cos(angle), radius * math.sin(angle), z0))
        verts.append((radius * math.cos(angle), radius * math.sin(angle), z1))
    faces = []
    for i in range(segments):
        a = i * 2
        b = a + 1
        c = ((i + 1) % segments) * 2 + 1
        e = ((i + 1) % segments) * 2
        faces.append((a, e, c, b))
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


def create_cake(name, spec, d):
    r_max = d["r_inner"] - 0.08
    z0 = d["internal_bottom_z"]
    z1 = z0 + d["cake_h"]
    dish = spec["inner_dish"]
    segments = 96
    side_rings, top_rings, bot_rings = 6, 6, 5
    rings = 1 + bot_rings + side_rings + top_rings + 1
    verts = []
    for i in range(segments):
        angle = (i / segments) * math.tau
        cosine = math.cos(angle)
        sine = math.sin(angle)
        side_r = r_max * (1.0 + 0.008 * math.sin(13.0 * angle) + 0.005 * math.cos(9.0 * angle))
        irr = (
            0.11 * math.sin(3.0 * angle)
            + 0.07 * math.sin(7.0 * angle + 0.5)
            + 0.05 * math.cos(5.0 * angle + 1.2)
        )
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
            lift = irr * (0.40 + 0.60 * (1.0 - t))
            verts.append((mm(max(rr, 0.02)) * cosine, mm(max(rr, 0.02)) * sine, mm(z1 + lift)))
        verts.append((0.0, 0.0, mm(z1 + irr * 0.25)))
    faces = []
    for i in range(segments):
        nxt = (i + 1) % segments
        for j in range(rings - 1):
            a = i * rings + j
            b = nxt * rings + j
            c = nxt * rings + j + 1
            e = i * rings + j + 1
            faces.append((a, e, c, b))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    shade_smooth(obj)
    tex = bpy.data.textures.new(f"{name}_Pore", "CLOUDS")
    tex.noise_scale = 0.00085
    tex.noise_depth = 2
    disp = obj.modifiers.new("CakePore", "DISPLACE")
    disp.texture = tex
    disp.strength = mm(0.05)
    disp.mid_level = 0.5
    return obj


def build_vial(spec, mats):
    d = derived(spec)
    coll = ensure_collection("MASTER_3ML_WHITE")
    segs = spec["segments"]

    glass = create_lathe("VIAL_3ML_GLASS", glass_profile(spec, d), segs)
    assign(glass, mats["glass"])
    sub = glass.modifiers.new("GlassSmooth", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2

    stopper = create_lathe("VIAL_3ML_STOPPER", stopper_profile(spec, d), 80)
    assign(stopper, mats["stopper"])

    crimp = create_lathe("VIAL_3ML_CRIMP", crimp_profile(spec, d), 128)
    assign(crimp, mats["crimp"])

    cap = create_lathe("VIAL_3ML_CAP", cap_profile(spec, d), 128)
    assign(cap, mats["cap"])
    cap.visible_glossy = False

    label = create_label("VIAL_3ML_LABEL", spec, d)
    assign(label, mats["label"])

    cake = create_cake("VIAL_3ML_CAKE", spec, d)
    assign(cake, mats["cake"])

    parts = {
        "glass": glass,
        "stopper": stopper,
        "crimp": crimp,
        "cap": cap,
        "label": label,
        "cake": cake,
        "derived": d,
        "collection": coll,
    }
    for obj in (glass, stopper, crimp, cap, label, cake):
        link_exclusive(obj, coll)
    return parts


def hide_from_camera(obj, *, transmission=True, glossy=True, diffuse=True, shadow=True):
    obj.visible_camera = False
    obj.visible_transmission = transmission
    obj.visible_glossy = glossy
    obj.visible_diffuse = diffuse
    obj.visible_shadow = shadow


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
    hide_from_camera(obj, transmission=False, glossy=True, diffuse=True, shadow=True)
    return obj


def add_card(name, loc, size_xy, rot, collection, color=(0.92, 0.92, 0.93)):
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
    set_input(bsdf, ["Roughness"], 0.40)
    set_input(bsdf, ["Metallic"], 0.0)
    assign(obj, mat)
    hide_from_camera(obj, transmission=True, glossy=True, diffuse=False, shadow=False)
    return obj


def apply_light_linking(light_obj, receiver_coll):
    if receiver_coll is None or not hasattr(light_obj, "light_linking"):
        return
    try:
        light_obj.light_linking.receiver_collection = receiver_coll
    except Exception:
        pass


def unlink_all(coll):
    for obj in list(coll.objects):
        coll.objects.unlink(obj)


def setup_studio(parts, mats):
    d = parts["derived"]
    height = mm(d["total_assembly_h"])
    radius = mm(SPEC["r_outer"])
    lights = ensure_collection("LIGHTING_3ML")
    studio = ensure_collection("STUDIO_3ML")

    body_recv = ensure_collection("LIT_BODY")
    cap_recv = ensure_collection("LIT_CAP")
    unlink_all(body_recv)
    unlink_all(cap_recv)
    for obj in parts["collection"].objects:
        target = cap_recv if "CAP" in obj.name else body_recv
        try:
            target.objects.link(obj)
        except RuntimeError:
            pass

    key = add_area(
        "Key",
        loc=(mm(28), mm(-42), height * 0.62),
        energy=18,
        rot=(math.radians(68), 0, math.radians(22)),
        size=(mm(55), mm(40)),
        collection=lights,
    )
    fill = add_area(
        "Fill",
        loc=(mm(-24), mm(-38), height * 0.48),
        energy=8,
        rot=(math.radians(72), 0, math.radians(-18)),
        size=(mm(48), mm(36)),
        collection=lights,
    )
    rim_l = add_area(
        "RimLeft",
        loc=(-radius - mm(22), mm(16), height * 0.42),
        energy=14,
        rot=(math.radians(82), 0, math.radians(-14)),
        size=(mm(3.6), height * 0.78),
        collection=lights,
    )
    rim_r = add_area(
        "RimRight",
        loc=(radius + mm(22), mm(14), height * 0.40),
        energy=11,
        rot=(math.radians(82), 0, math.radians(14)),
        size=(mm(3.4), height * 0.74),
        collection=lights,
    )
    cake = add_area(
        "CakeKiss",
        loc=(mm(10), mm(-26), mm(8)),
        energy=10,
        rot=(math.radians(64), 0, math.radians(-10)),
        size=(mm(22), mm(14)),
        collection=lights,
    )
    cap_key = add_area(
        "CapKey",
        loc=(mm(12), mm(-20), height + mm(8)),
        energy=0.55,
        rot=(math.radians(58), 0, math.radians(18)),
        size=(mm(12), mm(8)),
        collection=lights,
    )
    add_card(
        "CardLeft",
        loc=(-radius - mm(26), mm(4), height * 0.40),
        size_xy=(mm(9), height * 0.82),
        rot=(0, 0, math.radians(-100)),
        collection=lights,
    )
    add_card(
        "CardRight",
        loc=(radius + mm(26), mm(4), height * 0.40),
        size_xy=(mm(8), height * 0.78),
        rot=(0, 0, math.radians(100)),
        collection=lights,
    )
    add_card(
        "CardBack",
        loc=(0.0, mm(40), height * 0.42),
        size_xy=(radius * 4.0, height * 0.90),
        rot=(0, 0, math.radians(180)),
        collection=lights,
        color=(0.90, 0.90, 0.91),
    )

    for light_obj in (key, fill, rim_l, rim_r, cake):
        apply_light_linking(light_obj, body_recv)
    apply_light_linking(cap_key, cap_recv)

    # Visible light-gray studio cyc: floor + backdrop.
    floor = bpy.data.meshes.new("StudioFloor")
    s = mm(180)
    floor.from_pydata(
        [(-s, -s, mm(-0.02)), (s, -s, mm(-0.02)), (s, s, mm(-0.02)), (-s, s, mm(-0.02))],
        [],
        [(0, 1, 2, 3)],
    )
    floor.update()
    floor_obj = bpy.data.objects.new("StudioFloor", floor)
    studio.objects.link(floor_obj)
    assign(floor_obj, mats["studio"])

    back = bpy.data.meshes.new("StudioBack")
    bw, bh = mm(200), mm(160)
    back.from_pydata(
        [(-bw / 2, mm(70), mm(-5)), (bw / 2, mm(70), mm(-5)), (bw / 2, mm(70), bh), (-bw / 2, mm(70), bh)],
        [],
        [(0, 1, 2, 3)],
    )
    back.update()
    back_obj = bpy.data.objects.new("StudioBack", back)
    studio.objects.link(back_obj)
    assign(back_obj, mats["studio"])
    return studio


def attach_reference(cam):
    if not REF_PATH.exists():
        return
    img = bpy.data.images.load(str(REF_PATH), check_existing=True)
    cam.data.show_background_images = True
    bg = cam.data.background_images.new()
    bg.image = img
    bg.alpha = 0.40
    bg.display_depth = "BACK"
    bg.frame_method = "FIT"


def setup_camera(scene, d):
    cam_data = bpy.data.cameras.new("CAMERA_3ML_WHITE")
    cam = bpy.data.objects.new("CAMERA_3ML_WHITE", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.data.type = "PERSP"
    cam.data.lens = 120.0
    cam.data.sensor_width = 36
    cam.data.sensor_fit = "VERTICAL"
    cam.data.clip_start = 0.01
    cam.data.clip_end = 4.0
    height = d["total_assembly_h"]
    look = (0.0, 0.0, mm(height * 0.48))
    frame_h = height * 1.38
    distance = mm((frame_h * 120.0) / 36.0)
    cam.location = (look[0], look[1] - distance, look[2])
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    scene.camera = cam
    attach_reference(cam)
    return cam


def configure_render(scene, samples, transparent):
    scene.render.resolution_x = RENDER_SIZE[0]
    scene.render.resolution_y = RENDER_SIZE[1]
    scene.render.resolution_percentage = 100
    scene.cycles.samples = samples
    scene.render.threads_mode = "AUTO"
    scene.render.film_transparent = transparent


def set_studio_visible(visible):
    if "STUDIO_3ML" not in bpy.data.collections:
        return
    for obj in bpy.data.collections["STUDIO_3ML"].objects:
        obj.hide_render = not visible
        obj.hide_viewport = not visible


def render_still(scene, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    print(f"Wrote {path}")


def main():
    args = parse_args()
    scene = reset_scene()
    mats = build_materials()
    parts = build_vial(SPEC, mats)
    d = parts["derived"]
    report = {"spec_mm": SPEC, "derived_mm": d}
    RENDERS_DIR.mkdir(parents=True, exist_ok=True)
    (RENDERS_DIR / "3ml-white-measurements.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, indent=2))

    setup_studio(parts, mats)
    setup_camera(scene, d)
    bpy.context.view_layer.update()

    if not args.skip_render:
        configure_render(scene, args.samples, transparent=False)
        set_studio_visible(True)
        render_still(scene, RENDERS_DIR / "3ml-white-studio.png")

        configure_render(scene, args.samples, transparent=True)
        set_studio_visible(False)
        render_still(scene, RENDERS_DIR / "3ml-white-transparent.png")

    blend_path = MASTERS_DIR / "vial-3ml-white-dev.blend"
    blend_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f"Wrote {blend_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        raise
