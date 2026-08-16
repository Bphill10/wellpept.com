#!/usr/bin/env python3
"""Minimal Blender / Cycles environment probe.

Renders one transparent PNG and prints version + compute devices.
Run via: blender --background --python tools/blender-vials/scripts/test_blender_env.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import bpy


SCRIPT_DIR = Path(os.path.dirname(os.path.realpath(__file__)))
OUT = SCRIPT_DIR.parent / "renders" / "env_test_transparent.png"


def reset_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = str(OUT)
    return scene


def add_probe_sphere():
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1.0)
    obj = bpy.context.active_object
    obj.name = "EnvProbe"
    mat = bpy.data.materials.new("EnvProbeMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.85, 0.85, 0.88, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.35
    obj.data.materials.append(mat)
    return obj


def add_camera(scene):
    cam_data = bpy.data.cameras.new("EnvCam")
    cam = bpy.data.objects.new("EnvCam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, -4.2, 0.0)
    cam.rotation_euler = (1.57079632679, 0.0, 0.0)
    scene.camera = cam
    return cam


def add_light():
    light = bpy.data.lights.new("EnvKey", type="AREA")
    light.energy = 400
    light.size = 3.0
    obj = bpy.data.objects.new("EnvKey", light)
    bpy.context.collection.objects.link(obj)
    obj.location = (2.0, -2.5, 2.5)
    obj.rotation_euler = (0.9, 0.2, 0.4)
    return obj


def cycles_devices():
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.get_devices()
    except Exception:
        pass
    devices = []
    for device in getattr(prefs, "devices", []):
        devices.append(
            {
                "name": device.name,
                "type": device.type,
                "use": bool(device.use),
            }
        )
    return {
        "compute_device_type": prefs.compute_device_type,
        "devices": devices,
    }


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    scene = reset_scene()
    add_probe_sphere()
    add_camera(scene)
    add_light()
    bpy.ops.render.render(write_still=True)

    image = bpy.data.images.load(str(OUT))
    report = {
        "ok": True,
        "blender": bpy.app.version_string,
        "engine": scene.render.engine,
        "device": scene.cycles.device,
        "film_transparent": bool(scene.render.film_transparent),
        "color_mode": scene.render.image_settings.color_mode,
        "output": str(OUT),
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "has_alpha": bool(image.channels == 4 or image.alpha_mode != "NONE"),
        "channels": int(image.channels),
        "cycles": cycles_devices(),
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
