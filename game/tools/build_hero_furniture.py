"""Generate DearV's first cloud-authored hero furniture pack.

The script intentionally uses only Blender's built-in Python API so GitHub
Actions can reproduce every GLB without a workstation installation.

Run with:
  blender --background --python game/tools/build_hero_furniture.py
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "game" / "assets" / "models"
PREVIEW_DIR = ROOT / "game" / "assets" / "previews"


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def _material_pattern(name: str) -> str:
    lowered = name.lower()
    if any(word in lowered for word in ("oak", "walnut", "wood", "wardrobe backing")):
        return "wood"
    if any(word in lowered for word in ("upholstery", "linen", "duvet", "leather", "wool", "silk", "calfskin", "couture", "paper")):
        return "fabric"
    if any(word in lowered for word in ("steel", "bronze", "nickel", "rail", "metal")):
        return "metal"
    if any(word in lowered for word in ("stone", "porcelain", "limestone")):
        return "stone"
    return "smooth"


def mat(name, color, roughness=0.55, metallic=0.0):
    """Principled BSDF with procedural surface variation baked in via nodes.

    A flat diffuse_color reads as painted plastic under any lighting. Real
    upholstery, wood and stone all vary in tone, roughness and micro-relief
    across the surface — driving Base Color / Roughness / Normal from a
    couple of Noise Texture nodes (keyed off object-space coordinates, so no
    UV unwrap is required) gets most of that realism without needing an
    external texture library.
    """
    pattern = _material_pattern(name)
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic

    if pattern == "smooth" and roughness < 0.2:
        # Glass/screen-like materials stay clean; grain would look wrong.
        return material

    tex_coord = nodes.new("ShaderNodeTexCoord")

    grain_scale = {"wood": 3.5, "fabric": 26.0, "metal": 40.0, "stone": 9.0, "smooth": 14.0}[pattern]
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1.0, 1.0, 6.0 if pattern == "wood" else 1.0)
    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])

    color_noise = nodes.new("ShaderNodeTexNoise")
    color_noise.inputs["Scale"].default_value = grain_scale
    color_noise.inputs["Detail"].default_value = 2.0 if pattern == "wood" else 5.0
    color_noise.inputs["Roughness"].default_value = 0.6
    links.new(mapping.outputs["Vector"], color_noise.inputs["Vector"])

    color_ramp = nodes.new("ShaderNodeValToRGB")
    spread = 0.16 if pattern == "wood" else 0.06 if pattern == "fabric" else 0.03
    color_ramp.color_ramp.elements[0].position = 0.4
    color_ramp.color_ramp.elements[0].color = (
        max(0.0, color[0] * (1 - spread)),
        max(0.0, color[1] * (1 - spread)),
        max(0.0, color[2] * (1 - spread)),
        1.0,
    )
    color_ramp.color_ramp.elements[1].position = 0.6
    color_ramp.color_ramp.elements[1].color = (
        min(1.0, color[0] * (1 + spread) + 0.02),
        min(1.0, color[1] * (1 + spread) + 0.02),
        min(1.0, color[2] * (1 + spread) + 0.02),
        1.0,
    )
    links.new(color_noise.outputs["Fac"], color_ramp.inputs["Fac"])
    links.new(color_ramp.outputs["Color"], bsdf.inputs["Base Color"])

    rough_noise = nodes.new("ShaderNodeTexNoise")
    rough_noise.inputs["Scale"].default_value = grain_scale * (0.5 if pattern == "wood" else 2.2)
    rough_map = nodes.new("ShaderNodeMapRange")
    rough_variance = 0.1 if pattern == "metal" else 0.16
    rough_map.inputs["To Min"].default_value = max(0.05, roughness - rough_variance)
    rough_map.inputs["To Max"].default_value = min(1.0, roughness + rough_variance)
    links.new(mapping.outputs["Vector"], rough_noise.inputs["Vector"])
    links.new(rough_noise.outputs["Fac"], rough_map.inputs["Value"])
    links.new(rough_map.outputs["Result"], bsdf.inputs["Roughness"])

    bump_source = color_noise
    if pattern == "fabric":
        weave = nodes.new("ShaderNodeTexWave")
        weave.wave_type = "BANDS"
        weave.inputs["Scale"].default_value = grain_scale * 1.4
        weave.inputs["Distortion"].default_value = 2.4
        links.new(mapping.outputs["Vector"], weave.inputs["Vector"])
        bump_source = weave
        bump_output = "Fac" if "Fac" in bump_source.outputs else "Color"
    else:
        bump_output = "Fac"

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = {
        "wood": 0.05,
        "fabric": 0.09,
        "metal": 0.015,
        "stone": 0.035,
        "smooth": 0.02,
    }[pattern]
    links.new(bump_source.outputs[bump_output], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    return material


def root_object(name: str):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root["asset_id"] = name.lower()
    root["units"] = "meters"
    return root


def rounded_box(name, location, size, material, bevel=0.04, segments=5, rotation=(0.0, 0.0, 0.0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(value / 2.0 for value in size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("Production edge radius", "BEVEL")
    modifier.width = max(0.003, min(bevel, min(size) * 0.42))
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.parent = parent
    return obj


def cylinder(name, location, radius, depth, material, parent=None, vertices=32, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("Rounded rim", "BEVEL")
    bevel.width = min(radius * 0.16, 0.018)
    bevel.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.parent = parent
    return obj


def sphere(name, location, scale, material, parent=None, segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(12, segments // 2), location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.parent = parent
    return obj


def pipe_between(name, start, end, radius, material, parent=None):
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    obj = cylinder(name, (start_v + end_v) * 0.5, radius, direction.length, material, parent, 24)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def tapered_prism(name, location, width_top, width_bottom, height, depth, material, parent=None):
    z0 = -height / 2.0
    z1 = height / 2.0
    y0 = -depth / 2.0
    y1 = depth / 2.0
    vertices = [
        (-width_bottom / 2, y0, z0), (width_bottom / 2, y0, z0),
        (-width_top / 2, y0, z1), (width_top / 2, y0, z1),
        (-width_bottom / 2, y1, z0), (width_bottom / 2, y1, z0),
        (-width_top / 2, y1, z1), (width_top / 2, y1, z1),
    ]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    mesh = bpy.data.meshes.new(f"{name} mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.parent = parent
    bevel = obj.modifiers.new("Soft tailored edge", "BEVEL")
    bevel.width = 0.025
    bevel.segments = 4
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def all_descendants(root):
    stack = list(root.children)
    result = []
    while stack:
        child = stack.pop()
        result.append(child)
        stack.extend(child.children)
    return result


def build_bed():
    root = root_object("DearV_Upholstered_Bed")
    charcoal = mat("Warm charcoal upholstery", (0.105, 0.11, 0.115, 1.0), 0.82)
    linen = mat("Ivory washed linen", (0.72, 0.69, 0.64, 1.0), 0.88)
    duvet = mat("Stone duvet", (0.43, 0.40, 0.37, 1.0), 0.9)
    bronze = mat("Champagne bronze", (0.18, 0.135, 0.09, 1.0), 0.3, 0.72)

    # Turned legs lift the whole bed clear of the floor. Without them the
    # frame reads as a solid block sitting on the ground -- a real bed
    # always shows a gap of floor/shadow underneath.
    leg_h = 0.16
    for x in (-1.0, 1.0):
        for y in (-1.03, 1.03):
            cylinder("Bed leg", (x, y, leg_h * 0.5), 0.05, leg_h, bronze, root, 16)
            sphere("Bed leg foot", (x, y, 0.014), (0.056, 0.056, 0.028), bronze, root, 12)

    z0 = leg_h
    rounded_box("Recessed bed plinth", (0.0, 0.08, z0 + 0.11), (2.16, 2.24, 0.18), bronze, 0.025, 4, parent=root)
    rounded_box("Upholstered bed frame", (0.0, 0.0, z0 + 0.34), (2.34, 2.46, 0.48), charcoal, 0.105, 8, parent=root)
    rounded_box("Mattress", (0.0, -0.03, z0 + 0.63), (2.10, 2.25, 0.32), linen, 0.13, 9, parent=root)
    rounded_box("Pillow-top quilting", (0.0, -0.03, z0 + 0.82), (2.02, 2.16, 0.10), linen, 0.045, 10, parent=root)
    rounded_box("Tall channel headboard", (0.0, 1.10, z0 + 1.28), (2.72, 0.22, 1.74), charcoal, 0.12, 9, parent=root)
    for x in (-0.90, -0.45, 0.0, 0.45, 0.90):
        pipe_between("Headboard channel", (x, 0.975, z0 + 0.62), (x, 0.975, z0 + 1.92), 0.014, bronze, root)
    rounded_box("Soft duvet", (0.0, -0.24, z0 + 0.89), (2.03, 1.74, 0.23), duvet, 0.11, 9, parent=root)
    rounded_box("Duvet folded edge", (0.0, 0.46, z0 + 1.00), (2.03, 0.38, 0.24), linen, 0.10, 9, rotation=(math.radians(-5), 0, 0), parent=root)
    for index, x in enumerate((-0.56, 0.56)):
        rounded_box(f"Sleeping pillow {index + 1}", (x, 0.70, z0 + 1.14), (0.91, 0.25, 0.48), linen, 0.105, 10, rotation=(math.radians(-12), 0, math.radians((-1) ** index * 2.5)), parent=root)
        rounded_box(f"Accent pillow {index + 1}", (x * 0.58, 0.49, z0 + 1.11), (0.58, 0.22, 0.53), charcoal, 0.11, 10, rotation=(math.radians(-7), 0, math.radians((-1) ** index * 5)), parent=root)
    rounded_box("Cashmere throw", (0.46, -0.78, z0 + 1.04), (0.88, 0.72, 0.055), charcoal, 0.025, 5, rotation=(0, 0, math.radians(-4)), parent=root)
    return root


def build_study():
    root = root_object("DearV_Executive_Study_Rig")
    walnut = mat("Smoked walnut", (0.19, 0.105, 0.055, 1.0), 0.43)
    leather = mat("Espresso leather", (0.035, 0.028, 0.026, 1.0), 0.52)
    metal = mat("Blackened steel", (0.022, 0.024, 0.026, 1.0), 0.22, 0.78)
    screen = mat("Monitor glass", (0.014, 0.021, 0.03, 1.0), 0.12, 0.18)
    paper = mat("Warm paper", (0.70, 0.65, 0.56, 1.0), 0.82)

    rounded_box("Executive desktop", (0.0, 0.0, 0.82), (3.85, 1.25, 0.11), walnut, 0.055, 7, parent=root)
    rounded_box("Left sculpted pedestal", (-1.54, 0.0, 0.42), (0.56, 1.04, 0.74), walnut, 0.055, 6, parent=root)
    for z in (0.25, 0.49, 0.70):
        rounded_box("Flush drawer face", (-1.835, -0.01, z), (0.025, 0.91, 0.16), walnut, 0.008, 3, parent=root)
    # A solid panel leg (not a thin metal frame) matches the weight of the
    # pedestal on the other end -- an "executive" desk shouldn't stand on
    # hairpin legs. A recessed bronze inlay keeps it from looking like a
    # plain slab.
    rounded_box("Right panel leg", (1.565, 0.0, 0.42), (0.32, 1.04, 0.74), walnut, 0.05, 6, parent=root)
    rounded_box("Right panel inlay", (1.735, 0.0, 0.42), (0.028, 0.82, 0.54), metal, 0.01, 3, parent=root)

    rounded_box("Monitor", (0.25, 0.14, 1.48), (1.45, 0.08, 0.84), metal, 0.035, 5, parent=root)
    rounded_box("Monitor display", (0.25, 0.092, 1.48), (1.31, 0.012, 0.70), screen, 0.008, 2, parent=root)
    pipe_between("Monitor stem", (0.25, 0.12, 0.93), (0.25, 0.12, 1.08), 0.035, metal, root)
    rounded_box("Monitor foot", (0.25, 0.04, 0.90), (0.58, 0.34, 0.035), metal, 0.018, 4, parent=root)
    rounded_box("Low keyboard", (0.25, -0.36, 0.90), (0.84, 0.31, 0.035), metal, 0.018, 4, rotation=(math.radians(3), 0, 0), parent=root)
    for row in range(4):
        for col in range(12):
            rounded_box("Keyboard key", (-0.11 + col * 0.06, -0.46 + row * 0.054, 0.923), (0.048, 0.044, 0.012), screen, 0.004, 2, parent=root)

    pipe_between("Lamp lower arm", (-1.05, 0.20, 0.94), (-0.95, 0.18, 1.52), 0.026, metal, root)
    pipe_between("Lamp upper arm", (-0.95, 0.18, 1.52), (-0.55, 0.05, 1.78), 0.026, metal, root)
    cylinder("Lamp shade", (-0.48, 0.02, 1.72), 0.17, 0.26, metal, root, 40, rotation=(0, math.radians(74), 0))
    cylinder("Lamp base", (-1.05, 0.20, 0.89), 0.18, 0.035, metal, root, 40)

    # Ergonomic chair with a curved-looking segmented back and a five-star base.
    rounded_box("Chair seat", (0.35, -1.12, 0.53), (0.68, 0.68, 0.16), leather, 0.11, 9, parent=root)
    for index, z in enumerate((0.78, 0.98, 1.18)):
        width = 0.66 - index * 0.06
        rounded_box("Chair back cushion", (0.35, -1.42, z), (width, 0.13, 0.27), leather, 0.08, 8, rotation=(math.radians(-7), 0, 0), parent=root)
    pipe_between("Chair spine", (0.35, -1.25, 0.42), (0.35, -1.38, 1.18), 0.035, metal, root)
    cylinder("Chair gas lift", (0.35, -1.12, 0.29), 0.045, 0.43, metal, root, 24)
    for angle in range(0, 360, 72):
        direction = Vector((math.cos(math.radians(angle)), math.sin(math.radians(angle)), 0.0))
        start = Vector((0.35, -1.12, 0.10))
        end = start + Vector((direction.x * 0.43, direction.y * 0.43, -0.035))
        pipe_between("Chair star leg", start, end, 0.025, metal, root)
        sphere("Chair caster", end + Vector((0, 0, -0.02)), (0.05, 0.035, 0.05), metal, root, 20)
    for x in (-0.34, 0.34):
        pipe_between("Chair arm support", (0.35 + x, -1.12, 0.57), (0.35 + x, -1.12, 0.85), 0.022, metal, root)
        rounded_box("Chair arm pad", (0.35 + x, -1.11, 0.87), (0.11, 0.44, 0.065), leather, 0.025, 5, parent=root)

    for index, x in enumerate((1.12, 1.32, 1.48)):
        rounded_box(f"Desk file {index + 1}", (x, 0.30, 0.91 + index * 0.018), (0.42, 0.31, 0.025), paper, 0.008, 2, rotation=(0, 0, math.radians(index * 3 - 3)), parent=root)
    return root


def add_hanger(root, x, y, z, metal):
    pipe_between("Hanger shoulder", (x, y, z), (x - 0.27, y, z - 0.17), 0.009, metal, root)
    pipe_between("Hanger shoulder", (x, y, z), (x + 0.27, y, z - 0.17), 0.009, metal, root)
    pipe_between("Hanger hook", (x, y, z), (x, y, z + 0.15), 0.008, metal, root)


def build_wardrobe():
    root = root_object("DearV_Walk_In_Wardrobe")
    oak = mat("Dark open-grain oak", (0.155, 0.085, 0.045, 1.0), 0.5)
    backing = mat("Warm wardrobe backing", (0.115, 0.065, 0.04, 1.0), 0.58)
    metal = mat("Champagne wardrobe rail", (0.22, 0.145, 0.075, 1.0), 0.25, 0.76)
    suit_colors = [
        mat("Midnight wool", (0.025, 0.035, 0.055, 1.0), 0.83),
        mat("Charcoal wool", (0.085, 0.09, 0.10, 1.0), 0.84),
        mat("Pearl silk", (0.58, 0.54, 0.49, 1.0), 0.5),
        mat("Burgundy couture", (0.18, 0.025, 0.035, 1.0), 0.72),
    ]
    leather_colors = [
        mat("Black calfskin", (0.025, 0.02, 0.018, 1.0), 0.36),
        mat("Caramel leather", (0.26, 0.095, 0.035, 1.0), 0.38),
        mat("Ivory leather", (0.66, 0.61, 0.52, 1.0), 0.42),
    ]

    # Open U-shaped cabinetry. There is no partition wall between bed and closet.
    rounded_box("Back wardrobe carcass", (0.0, 1.95, 1.32), (5.8, 0.46, 2.64), backing, 0.035, 4, parent=root)
    rounded_box("Left wardrobe carcass", (-2.67, 0.0, 1.32), (0.46, 4.3, 2.64), backing, 0.035, 4, parent=root)
    rounded_box("Right wardrobe carcass", (2.67, 0.0, 1.32), (0.46, 4.3, 2.64), backing, 0.035, 4, parent=root)
    for x in (-2.42, -1.42, -0.42, 0.58, 1.58, 2.42):
        rounded_box("Wardrobe divider", (x, 1.69, 1.32), (0.055, 0.49, 2.55), oak, 0.012, 3, parent=root)
    for x in (-2.0, -1.0, 0.0, 1.0, 2.0):
        rounded_box("Top shelf", (x, 1.58, 2.30), (0.90, 0.56, 0.055), oak, 0.012, 3, parent=root)
        rounded_box("Bottom shelf", (x, 1.58, 0.28), (0.90, 0.56, 0.055), oak, 0.012, 3, parent=root)
    pipe_between("Long garment rail", (-2.25, 1.30, 2.03), (2.25, 1.30, 2.03), 0.018, metal, root)

    for index in range(13):
        x = -2.15 + index * 0.36
        add_hanger(root, x, 1.30, 2.00, metal)
        cloth = suit_colors[index % len(suit_colors)]
        if index in (3, 8, 11):
            tapered_prism("Couture dress", (x, 1.30, 1.26), 0.38, 0.62, 1.25, 0.12, cloth, root)
        else:
            tapered_prism("Tailored jacket", (x, 1.30, 1.52), 0.50, 0.39, 0.76, 0.14, cloth, root)
            rounded_box("Pressed trousers", (x, 1.31, 0.86), (0.34, 0.10, 0.72), cloth, 0.025, 4, parent=root)

    # Real display shelves: bags rest on shelves; nothing floats in the room.
    for index, x in enumerate((-1.72, -0.62, 0.56, 1.72)):
        rounded_box("Bag display shelf", (x, 1.39, 0.72), (0.92, 0.58, 0.045), oak, 0.012, 3, parent=root)
        bag = rounded_box("Structured handbag", (x, 1.25, 0.98), (0.58, 0.18, 0.38), leather_colors[index % 3], 0.07, 7, parent=root)
        bag["dearv_role"] = "handbag"
        pipe_between("Bag handle left", (x - 0.20, 1.25, 1.17), (x - 0.12, 1.25, 1.38), 0.017, leather_colors[index % 3], root)
        pipe_between("Bag handle top", (x - 0.12, 1.25, 1.38), (x + 0.12, 1.25, 1.38), 0.017, leather_colors[index % 3], root)
        pipe_between("Bag handle right", (x + 0.12, 1.25, 1.38), (x + 0.20, 1.25, 1.17), 0.017, leather_colors[index % 3], root)

    # Central dressing island with drawers and a padded jewellery tray.
    rounded_box("Dressing island", (0.0, -0.40, 0.52), (2.05, 0.92, 1.02), oak, 0.065, 7, parent=root)
    rounded_box("Jewellery tray", (0.0, -0.40, 1.055), (1.72, 0.67, 0.055), suit_colors[2], 0.025, 5, parent=root)
    for x in (-0.48, 0.48):
        for z in (0.28, 0.56, 0.81):
            rounded_box("Island drawer face", (x, -0.875, z), (0.86, 0.035, 0.18), oak, 0.012, 3, parent=root)
            cylinder("Drawer pull", (x, -0.901, z), 0.018, 0.16, metal, root, 20, rotation=(math.radians(90), 0, 0))
    return root


def build_bathroom():
    root = root_object("DearV_Bathroom_Suite")
    stone = mat("Honed ivory stone", (0.66, 0.62, 0.55, 1.0), 0.62)
    porcelain = mat("Warm white porcelain", (0.86, 0.84, 0.79, 1.0), 0.24)
    walnut = mat("Vanity walnut", (0.18, 0.095, 0.048, 1.0), 0.46)
    metal = mat("Brushed nickel", (0.32, 0.34, 0.35, 1.0), 0.24, 0.78)
    glass = mat("Low iron shower glass", (0.50, 0.68, 0.72, 0.18), 0.08)
    glass.blend_method = "BLEND"

    # Freestanding oval tub built from nested smooth ellipsoids.
    sphere("Tub outer shell", (-3.72, 0.25, 0.49), (1.28, 0.67, 0.50), porcelain, root, 48)
    sphere("Tub inner well", (-3.72, 0.12, 0.64), (1.04, 0.48, 0.34), stone, root, 48)
    pipe_between("Tub filler riser", (-2.35, 0.66, 0.05), (-2.35, 0.66, 0.90), 0.028, metal, root)
    pipe_between("Tub filler spout", (-2.35, 0.66, 0.90), (-2.65, 0.47, 0.90), 0.028, metal, root)

    # Wall-mounted double vanity: both sinks are physically supported by the cabinet.
    rounded_box("Floating double vanity", (0.0, 0.75, 0.62), (3.35, 0.72, 0.74), walnut, 0.055, 6, parent=root)
    rounded_box("Vanity stone top", (0.0, 0.70, 1.02), (3.55, 0.83, 0.09), stone, 0.035, 5, parent=root)
    for index, x in enumerate((-0.90, 0.90)):
        sphere(f"Inset basin {index + 1}", (x, 0.56, 1.03), (0.48, 0.29, 0.10), porcelain, root, 40)
        pipe_between("Vanity faucet riser", (x, 0.92, 1.04), (x, 0.92, 1.36), 0.021, metal, root)
        pipe_between("Vanity faucet spout", (x, 0.92, 1.36), (x, 0.64, 1.36), 0.021, metal, root)
        rounded_box("Tall mirror", (x, 1.135, 2.02), (1.24, 0.045, 1.50), glass, 0.025, 4, parent=root)

    # Enclosed shower and wall-hung toilet.
    rounded_box("Shower tray", (3.65, 0.10, 0.055), (1.72, 1.52, 0.11), stone, 0.035, 4, parent=root)
    rounded_box("Shower glass front", (3.65, -0.64, 1.23), (1.72, 0.025, 2.38), glass, 0.01, 2, parent=root)
    rounded_box("Shower glass side", (4.50, 0.10, 1.23), (0.025, 1.52, 2.38), glass, 0.01, 2, parent=root)
    pipe_between("Rain shower riser", (3.95, 0.65, 0.34), (3.95, 0.65, 2.20), 0.024, metal, root)
    pipe_between("Rain shower arm", (3.95, 0.65, 2.20), (3.62, 0.38, 2.20), 0.024, metal, root)
    cylinder("Rain shower head", (3.62, 0.38, 2.17), 0.19, 0.035, metal, root, 48)
    rounded_box("Wall toilet cistern", (2.25, 0.92, 0.74), (0.78, 0.26, 1.08), stone, 0.06, 6, parent=root)
    sphere("Wall-hung toilet bowl", (2.25, 0.56, 0.48), (0.43, 0.60, 0.37), porcelain, root, 40)
    rounded_box("Toilet seat", (2.25, 0.38, 0.65), (0.70, 0.88, 0.075), porcelain, 0.12, 8, parent=root)
    return root


def add_preview_stage(target=(0.0, 0.0, 0.85), camera=(5.7, -7.4, 3.2), wide=False):
    floor = mat("Preview limestone", (0.34, 0.31, 0.28, 1.0), 0.72)
    rounded_box("Preview floor", (0.0, 0.0, -0.07), (12.0 if wide else 8.0, 8.0, 0.10), floor, 0.02, 2)
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.014, 0.018, 0.025, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.30

    for name, location, energy, size, color in (
        ("Window key", (-4.5, -4.2, 5.8), 1050.0, 4.2, (1.0, 0.84, 0.70)),
        ("Soft fill", (4.4, -1.0, 3.6), 660.0, 3.4, (0.64, 0.75, 1.0)),
        ("Warm rim", (0.0, 4.8, 4.5), 780.0, 3.0, (1.0, 0.62, 0.40)),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = location
        light.rotation_euler = (Vector(target) - light.location).to_track_quat("-Z", "Y").to_euler()

    camera_data = bpy.data.cameras.new("Preview camera")
    camera_data.lens = 55 if not wide else 50
    camera_obj = bpy.data.objects.new("Preview camera", camera_data)
    bpy.context.collection.objects.link(camera_obj)
    camera_obj.location = camera
    camera_obj.rotation_euler = (Vector(target) - camera_obj.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera_obj


def export_and_render(asset_name, root, target=(0.0, 0.0, 0.85), camera=(5.7, -7.4, 3.2), wide=False):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    glb_path = MODEL_DIR / f"{asset_name}.glb"
    preview_path = PREVIEW_DIR / f"{asset_name}.png"

    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in all_descendants(root):
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )

    add_preview_stage(target, camera, wide)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if bpy.app.version >= (4, 2, 0) else "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(preview_path)
    scene.render.film_transparent = False
    if hasattr(scene.view_settings, "look"):
        try:
            scene.view_settings.look = "AgX - Medium High Contrast"
        except TypeError:
            pass
    bpy.ops.render.render(write_still=True)
    print(f"Exported {glb_path}")
    print(f"Rendered {preview_path}")


ASSETS = (
    ("upholstered_bed", build_bed, (0.0, 0.0, 0.9), (4.6, -6.1, 3.0), False),
    ("executive_study_rig", build_study, (0.0, -0.25, 0.9), (5.8, -7.3, 3.35), False),
    ("walk_in_wardrobe", build_wardrobe, (0.0, 0.4, 1.25), (6.8, -7.8, 4.25), True),
    ("bathroom_suite", build_bathroom, (0.0, 0.25, 1.05), (8.4, -9.8, 4.5), True),
)


if __name__ == "__main__":
    for asset_name, builder, target, camera, wide in ASSETS:
        reset_scene()
        asset_root = builder()
        export_and_render(asset_name, asset_root, target, camera, wide)
