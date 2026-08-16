#!/usr/bin/env python3
"""
Undisclosed unlabeled vial studio — Blender / Cycles.

Renders unlabeled stock plates from shared scenes:
  01  3 mL white lyophilized cake
  02  3 mL cobalt-blue cake   (same 3 mL mesh, cake color only)
  03  10 mL white cake
  04  10 mL B12 ruby liquid at 75% fill
  05  5 mL white cake         (studio only until a 5ML profile exists)

Canvas is 1024 x 1536, pure black studio, black flip-off + brushed-silver crimp.
Run via tools/blender-vials/scripts/render.sh — do not invoke this file
with system Python.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector


SCRIPT_DIR = Path(os.path.dirname(os.path.realpath(__file__)))
TOOL_ROOT = SCRIPT_DIR.parent
DEFAULT_OUT = TOOL_ROOT / "renders"

CANVAS = (1024, 1536)
# Cycles treats 1 BU as 1 meter. Profiles below are authored in millimeters.
MM = 0.001

VARIANTS = {
    "01": {
        "file": "01_3mL_White_Powder_LOCKED.png",
        "profile": "3ml",
        "contents": "white_cake",
        "placement": "3ML_WHITE",
        "reference": "image-gen-3ml White.png",
    },
    "02": {
        "file": "02_3mL_Cobalt_Blue_Powder_LOCKED.png",
        "profile": "3ml",
        "contents": "cobalt_cake",
        "placement": "3ML_BLUE",
        "reference": "image-gen-3ml Blue.png",
    },
    "03": {
        "file": "03_10mL_White_Powder_LOCKED.png",
        "profile": "10ml",
        "contents": "white_cake",
        "placement": "10ML_WHITE",
        "reference": "image-gen-10ml White.png",
    },
    "04": {
        "file": "04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png",
        "profile": "10ml",
        "contents": "ruby_liquid",
        "placement": "10ML_B12_LIQUID",
        "reference": "image-gen-10ml Red.png",
    },
    "05": {
        "file": "05_5mL_White_Powder_LOCKED.png",
        "profile": "5ml",
        "contents": "white_cake",
        "placement": None,
        "reference": "image-gen-5ml White.png",
    },
}

# Hero-shot proportions that match the locked product photos (slightly
# chunkier than lab tubular vials so the wrap face stays wide enough).
PROFILES = {
    "3ml": {
        "r_outer": 10.25 * MM,
        "wall": 1.12 * MM,
        "heel": 1.15 * MM,
        "body_top": 33.4 * MM,
        "shoulder": 4.6 * MM,
        "neck_r": 6.55 * MM,
        "neck_h": 6.4 * MM,
        "bead_r": 7.35 * MM,
        "bead_h": 1.35 * MM,
        "lip_h": 1.05 * MM,
        "floor": 2.7 * MM,
        "cake_h": 6.4 * MM,
        "cap_r": 7.85 * MM,
        "cap_h": 2.15 * MM,
        "crimp_h": 5.4 * MM,
        "look_z": 22.2 * MM,
        "ortho": 56.8 * MM,
        "cam_y": -0.12,
        "body_height_mm": 35,
    },
    "5ml": {
        "r_outer": 11.55 * MM,
        "wall": 1.18 * MM,
        "heel": 1.22 * MM,
        "body_top": 40.2 * MM,
        "shoulder": 5.0 * MM,
        "neck_r": 8.1 * MM,
        "neck_h": 6.8 * MM,
        "bead_r": 8.9 * MM,
        "bead_h": 1.4 * MM,
        "lip_h": 1.1 * MM,
        "floor": 2.85 * MM,
        "cake_h": 7.1 * MM,
        "cap_r": 9.4 * MM,
        "cap_h": 2.22 * MM,
        "crimp_h": 5.7 * MM,
        "look_z": 25.8 * MM,
        "ortho": 66.0 * MM,
        "cam_y": -0.14,
        "body_height_mm": 42,
    },
    "10ml": {
        "r_outer": 13.05 * MM,
        "wall": 1.28 * MM,
        "heel": 1.35 * MM,
        "body_top": 49.6 * MM,
        "shoulder": 5.6 * MM,
        "neck_r": 10.05 * MM,
        "neck_h": 7.4 * MM,
        "bead_r": 10.85 * MM,
        "bead_h": 1.5 * MM,
        "lip_h": 1.15 * MM,
        "floor": 3.1 * MM,
        "cake_h": 8.2 * MM,
        "cap_r": 11.35 * MM,
        "cap_h": 2.35 * MM,
        "crimp_h": 6.2 * MM,
        "look_z": 30.4 * MM,
        "ortho": 78.4 * MM,
        "cam_y": -0.16,
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
        default="01,02,03,04,05",
        help="Comma-separated variant ids (01 02 03 04 05)",
    )
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--preview", action="store_true", help="512x768, 24 samples")
    parser.add_argument("--samples", type=int, default=0)
    parser.add_argument("--clay", action="store_true", help="Gray diffuse, no glass")
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
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.05
    scene.view_settings.gamma = 1.0
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    world = bpy.data.worlds.new("StudioBlack")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.004, 0.004, 0.004, 1)
    bg.inputs["Strength"].default_value = 0.15
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
        (0.0, 0.18 * MM),
        (r_out * 0.42, 0.06 * MM),
        (r_out - heel * 0.85, 0.0),
        (r_out, heel),
        (r_out, body_top),
    ]
    outer += smooth_steps((r_out, body_top), (neck_r, z_neck), 12)[1:]
    outer += [
        (neck_r, z_bead),
        (bead_r, z_bead + bead_h * 0.35),
        (bead_r, z_lip),
        (neck_r + 0.15 * MM, z_top),
        (neck_inner, z_top),
        (neck_inner, z_bead),
    ]
    inner = list(
        reversed(smooth_steps((r_in, body_top + 0.15 * MM), (neck_inner, z_neck), 7))
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
    """Build a closed surface of revolution from (radius, z) rings."""
    rings = len(profile)
    verts = []
    for i in range(segments):
        angle = (i / segments) * math.tau
        cosine = math.cos(angle)
        sine = math.sin(angle)
        for radius, z in profile:
            verts.append((radius * cosine, radius * sine, z))
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
    bpy.context.collection.objects.link(obj)
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


def create_disk_volume(name, radius, z0, z1, segments=64, meniscus=0.0):
    core = 0.02 * MM
    profile = [(core, z0), (radius, z0), (radius, z1)]
    if meniscus:
        for i in range(1, 10):
            t = i / 9
            r = radius * (1.0 - t)
            dip = meniscus * (1.0 - (max(r, core) / radius) ** 2)
            profile.append((max(r, core), z1 - dip))
    else:
        profile.append((core, z1))
    return create_lathe(name, profile, segments=segments)


def create_cap_assembly(p, dims):
    z_bead = dims["z_bead"]
    crimp_h = p["crimp_h"]
    cap_r = p["cap_r"]
    cap_h = p["cap_h"]
    neck_r = p["neck_r"]
    z_flip0 = z_bead + crimp_h * 0.55
    z_flip1 = z_flip0 + cap_h
    flip = create_disk_volume("FlipCap", cap_r, z_flip0, z_flip1, segments=64)
    crimp_top = create_disk_volume(
        "CrimpTop",
        cap_r * 0.92,
        z_bead + crimp_h * 0.28,
        z_flip0 + 0.15 * MM,
        segments=64,
    )
    crimp_skirt = create_disk_volume(
        "CrimpSkirt",
        neck_r + 0.45 * MM,
        z_bead - 0.15 * MM,
        z_bead + crimp_h * 0.42,
        segments=64,
    )
    stopper = create_disk_volume(
        "Stopper",
        dims["neck_inner"] * 0.96,
        z_bead - 3.4 * MM,
        z_bead + 0.4 * MM,
        segments=48,
    )
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
    mat = bpy.data.materials.new("VialGlass")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    glass = nodes.new("ShaderNodeBsdfGlass")
    glass.inputs["Color"].default_value = (1, 1, 1, 1)
    glass.inputs["Roughness"].default_value = 0.012
    glass.inputs["IOR"].default_value = 1.5
    links.new(glass.outputs["BSDF"], out.inputs["Surface"])
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
    bsdf.inputs["Roughness"].default_value = 0.62
    bsdf.inputs["Specular IOR Level"].default_value = 0.18
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
    bump.inputs["Distance"].default_value = 0.12 * MM
    links.new(mix.outputs["Result"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color
    emit.inputs["Strength"].default_value = 0.4
    mix_sh = nodes.new("ShaderNodeMixShader")
    mix_sh.inputs["Fac"].default_value = 0.2
    out = next(node for node in nodes if node.type == "OUTPUT_MATERIAL")
    links.new(bsdf.outputs["BSDF"], mix_sh.inputs[1])
    links.new(emit.outputs["Emission"], mix_sh.inputs[2])
    links.new(mix_sh.outputs["Shader"], out.inputs["Surface"])
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


def clay_material(color=(0.55, 0.55, 0.55, 1)):
    mat, _nodes, _links, bsdf, _out = new_material("Clay")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = 0.65
    bsdf.inputs["Metallic"].default_value = 0.0
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
    obj.visible_camera = False
    obj.visible_shadow = True
    if hasattr(obj, "visible_glossy"):
        obj.visible_glossy = True
    return obj


def setup_lights(p):
    z = p["look_z"]
    add_area(
        "RimLeft",
        loc=(-0.055, 0.018, z + 0.006),
        scale=(1, 1, 1),
        energy=220,
        rot=(math.radians(78), 0, math.radians(-28)),
        size=(0.008, 0.1),
    )
    add_area(
        "RimRight",
        loc=(0.058, 0.016, z + 0.002),
        scale=(1, 1, 1),
        energy=200,
        rot=(math.radians(78), 0, math.radians(30)),
        size=(0.008, 0.095),
    )
    add_area(
        "CapKey",
        loc=(0.0, 0.03, z + 0.07),
        scale=(1, 1, 1),
        energy=18,
        rot=(math.radians(40), 0, 0),
        size=(0.04, 0.03),
    )
    add_area(
        "CakeKiss",
        loc=(0.04, 0.05, 0.012),
        scale=(1, 1, 1),
        energy=14,
        rot=(math.radians(65), 0, math.radians(-25)),
        size=(0.02, 0.02),
    )


def setup_camera(scene, p, preview):
    cam_data = bpy.data.cameras.new("StudioCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = p["ortho"]
    cam_data.clip_start = 0.01
    cam_data.clip_end = 2.0
    cam = bpy.data.objects.new("StudioCam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, p["cam_y"], p["look_z"])
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    scene.camera = cam
    return cam


def setup_floor():
    bpy.ops.mesh.primitive_plane_add(size=0.4, location=(0, 0, -0.0003))
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


def build_variant(scene, variant_id, preview, samples, out_dir, clay=False):
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
    assign(glass, clay_material((0.62, 0.64, 0.66, 1)) if clay else glass_material())

    flip, crimp_top, crimp_skirt, stopper = create_cap_assembly(p, dims)
    assign(flip, clay_material((0.04, 0.04, 0.045, 1)) if clay else plastic_material())
    assign(crimp_top, clay_material((0.55, 0.56, 0.58, 1)) if clay else crimp_material())
    assign(crimp_skirt, clay_material((0.55, 0.56, 0.58, 1)) if clay else crimp_material())
    assign(stopper, clay_material((0.12, 0.12, 0.13, 1)) if clay else stopper_material())

    r_cake = dims["r_inner"] - 0.08 * MM
    if spec["contents"] == "ruby_liquid":
        chamber_h = dims["z_body_top"] - dims["z_floor"]
        fill = dims["z_floor"] + chamber_h * 0.75
        liquid = create_disk_volume(
            "RubyLiquid",
            r_cake,
            dims["z_floor"] + 0.05 * MM,
            fill,
            meniscus=0.55 * MM,
        )
        assign(liquid, clay_material(RUBY) if clay else liquid_material())
    else:
        color = COBALT_CAKE if spec["contents"] == "cobalt_cake" else WHITE_CAKE
        cake = create_disk_volume(
            "PeptideCake",
            r_cake,
            dims["z_floor"] + 0.04 * MM,
            dims["z_floor"] + p["cake_h"],
            meniscus=0.12 * MM,
        )
        assign(cake, clay_material(color) if clay else cake_material(color))

    # No studio floor — a visible plane reads as a white slab through glass.
    setup_lights(p)
    cam = setup_camera(scene, p, preview)
    bpy.context.view_layer.update()

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
        "reference": spec.get("reference"),
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
            raise SystemExit(f"Unknown variant {item}. Use 01,02,03,04,05.")
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    results = [
        build_variant(bpy.context.scene, item, args.preview, args.samples, out_dir, clay=args.clay)
        for item in ids
    ]
    sidecar = out_dir / ("bounds.preview.json" if args.preview else "bounds.json")
    sidecar.write_text(json.dumps({"variants": results}, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {sidecar}")


if __name__ == "__main__":
    main()
