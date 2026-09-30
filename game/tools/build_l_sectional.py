"""Build the DearV hero L-sectional and export a reproducible GLB + preview.

Run with:
  blender --background --python game/tools/build_l_sectional.py
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
ASSET_DIR = ROOT / "game" / "assets" / "models"
PREVIEW_DIR = ROOT / "game" / "assets" / "previews"
MATERIAL_DIR = ROOT / "game" / "assets" / "materials"
GLB_PATH = ASSET_DIR / "l_sectional_sofa.glb"
BLEND_PATH = ASSET_DIR / "l_sectional_sofa.blend"
PREVIEW_PATH = PREVIEW_DIR / "l_sectional_sofa.png"


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


def material(name: str, color: tuple[float, float, float, float], roughness: float, metallic: float = 0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def _save_image(name: str, path: Path, pixels: list[float], size: int, non_color: bool = False):
    image = bpy.data.images.new(name, width=size, height=size, alpha=True)
    image.pixels.foreach_set(pixels)
    image.file_format = "PNG"
    image.filepath_raw = str(path)
    if non_color:
        image.colorspace_settings.name = "Non-Color"
    image.save()
    return image


def charcoal_velvet_material():
    """Create embedded PBR maps so the game model is fabric, not gray plastic."""
    MATERIAL_DIR.mkdir(parents=True, exist_ok=True)
    size = 256
    rng = random.Random(5202027)
    heights: list[float] = []
    for y in range(size):
        for x in range(size):
            fine = rng.uniform(-1.0, 1.0)
            vertical = math.sin(x * math.tau / 3.8) * 0.16
            cross = math.sin((x + y * 0.32) * math.tau / 9.0) * 0.08
            heights.append(0.5 + fine * 0.16 + vertical + cross)

    albedo_pixels: list[float] = []
    normal_pixels: list[float] = []
    roughness_pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            index = y * size + x
            h = heights[index]
            variation = (h - 0.5) * 0.045
            # Linear deep charcoal: visibly dark, but still holds soft highlights.
            albedo_pixels.extend((0.075 + variation, 0.082 + variation, 0.088 + variation, 1.0))
            left = heights[y * size + ((x - 1) % size)]
            right = heights[y * size + ((x + 1) % size)]
            down = heights[((y - 1) % size) * size + x]
            up = heights[((y + 1) % size) * size + x]
            nx = max(-1.0, min(1.0, (left - right) * 0.52))
            ny = max(-1.0, min(1.0, (down - up) * 0.52))
            normal_pixels.extend((0.5 + nx * 0.5, 0.5 + ny * 0.5, 1.0, 1.0))
            r = max(0.58, min(0.82, 0.70 + (h - 0.5) * 0.12))
            roughness_pixels.extend((r, r, r, 1.0))

    albedo = _save_image("Charcoal velvet albedo", MATERIAL_DIR / "charcoal_velvet_albedo.png", albedo_pixels, size)
    normal = _save_image("Charcoal velvet normal", MATERIAL_DIR / "charcoal_velvet_normal.png", normal_pixels, size, True)
    roughness = _save_image("Charcoal velvet roughness", MATERIAL_DIR / "charcoal_velvet_roughness.png", roughness_pixels, size, True)

    mat = bpy.data.materials.new("Deep charcoal short-pile velvet")
    mat.diffuse_color = (0.075, 0.082, 0.088, 1.0)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.78
    bsdf.inputs["IOR"].default_value = 1.34
    bsdf.inputs["Sheen Weight"].default_value = 0.12
    bsdf.inputs["Sheen Roughness"].default_value = 0.72

    albedo_node = nodes.new("ShaderNodeTexImage")
    albedo_node.name = "Velvet albedo"
    albedo_node.image = albedo
    links.new(albedo_node.outputs["Color"], bsdf.inputs["Base Color"])

    rough_node = nodes.new("ShaderNodeTexImage")
    rough_node.name = "Velvet roughness"
    rough_node.image = roughness
    links.new(rough_node.outputs["Color"], bsdf.inputs["Roughness"])

    normal_texture = nodes.new("ShaderNodeTexImage")
    normal_texture.name = "Velvet normal"
    normal_texture.image = normal
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 0.09
    links.new(normal_texture.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def rounded_box(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat,
    bevel: float = 0.08,
    segments: int = 5,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(axis / 2.0 for axis in scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel_mod = obj.modifiers.new("Soft upholstered radius", "BEVEL")
    bevel_mod.width = bevel
    bevel_mod.segments = segments
    bevel_mod.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel_mod.name)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def add_cushion(name: str, location, size, fabric, rotation=(0.0, 0.0, 0.0)):
    cushion = rounded_box(name, location, size, fabric, bevel=min(size) * 0.24, segments=8, rotation=rotation)
    cushion["dearv_role"] = "upholstery_cushion"
    return cushion


def build_sofa():
    fabric = charcoal_velvet_material()
    base_mat = material("Recessed charcoal plinth", (0.018, 0.020, 0.023, 1.0), 0.42)
    foot_mat = material("Dark bronze feet", (0.020, 0.018, 0.017, 1.0), 0.30, 0.68)

    root = bpy.data.objects.new("DearV_L_Sectional", None)
    bpy.context.collection.objects.link(root)
    root["asset_id"] = "dearv_l_sectional_v2"
    root["units"] = "meters"

    # Low, architectural frame. The chaise is integrated into the same silhouette.
    base = rounded_box("Main upholstered frame", (0.0, 0.0, 0.25), (4.52, 1.12, 0.30), fabric, 0.075, 7)
    base.parent = root
    chaise_base = rounded_box("Integrated chaise frame", (-1.66, -0.72, 0.25), (1.20, 2.52, 0.30), fabric, 0.075, 7)
    chaise_base.parent = root
    plinth = rounded_box("Main shadow plinth", (0.0, 0.01, 0.095), (4.20, 0.92, 0.14), base_mat, 0.028, 4)
    plinth.parent = root
    chaise_plinth = rounded_box("Chaise shadow plinth", (-1.66, -0.70, 0.095), (0.94, 2.22, 0.14), base_mat, 0.028, 4)
    chaise_plinth.parent = root

    seat_x = (-1.66, -0.60, 0.42, 1.44)
    for index, x in enumerate(seat_x):
        depth = 0.88
        y = -0.10
        if index == 0:
            depth = 2.08
            y = -0.70
        cushion = add_cushion(
            f"Seat cushion {index + 1}",
            (x, y, 0.49),
            (0.96, depth, 0.20),
            fabric,
        )
        cushion.parent = root

    back_frame = rounded_box("Low back frame", (0.0, 0.47, 0.66), (4.22, 0.20, 0.72), fabric, 0.07, 7)
    back_frame.parent = root
    back_x = (-1.66, -0.60, 0.42, 1.44)
    for index, x in enumerate(back_x):
        angle = math.radians(-9.0 + (index % 2) * 0.8)
        back = rounded_box(
            f"Back cushion {index + 1}",
            (x, 0.38, 0.82),
            (0.97, 0.24, 0.60),
            fabric,
            0.085,
            8,
            rotation=(angle, 0.0, 0.0),
        )
        back.parent = root
        back["dearv_role"] = "upholstery_cushion"

    left_arm = rounded_box("Low chaise arm", (-2.21, -0.63, 0.57), (0.26, 2.35, 0.60), fabric, 0.075, 7)
    left_arm.parent = root
    right_arm = rounded_box("Low right arm", (2.21, -0.01, 0.57), (0.26, 1.10, 0.60), fabric, 0.075, 7)
    right_arm.parent = root

    # Two pillows actually rest against the back and compress into the seat line.
    accent_specs = [
        ("Loose cushion left", (-1.57, 0.12, 0.79), (0.47, 0.17, 0.46), (math.radians(-10), math.radians(8), math.radians(-11))),
        ("Loose cushion right", (1.56, 0.14, 0.79), (0.46, 0.17, 0.45), (math.radians(-10), math.radians(-7), math.radians(10))),
    ]
    for name, location, size, rotation in accent_specs:
        accent = rounded_box(name, location, size, fabric, 0.09, 8, rotation)
        accent.parent = root

    for x, y in [(-1.96, -1.66), (-1.96, 0.34), (1.96, -0.36), (1.96, 0.34)]:
        foot = rounded_box("Recessed bronze foot", (x, y, 0.045), (0.07, 0.07, 0.09), foot_mat, 0.010, 3)
        foot.parent = root

    # Origin is centered on the floor for predictable placement in Godot.
    return root


def add_preview_stage():
    floor_mat = material("Preview limestone", (0.34, 0.31, 0.28, 1.0), 0.70)
    floor = rounded_box("Preview floor", (0.0, 0.0, -0.08), (9.0, 8.0, 0.10), floor_mat, 0.02, 2)
    floor["preview_only"] = True

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.018, 0.021, 0.026, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.24

    def area(name, location, energy, size, color):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        direction = Vector((0.0, 0.0, 0.65)) - obj.location
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        return obj

    area("Key window", (-4.2, -4.0, 5.5), 920.0, 4.0, (1.0, 0.84, 0.70))
    area("Soft fill", (3.8, -1.0, 3.2), 610.0, 3.2, (0.62, 0.74, 1.0))
    area("Rim", (0.0, 4.0, 4.2), 720.0, 2.6, (1.0, 0.64, 0.42))

    camera_data = bpy.data.cameras.new("Preview camera")
    camera_data.lens = 55
    camera = bpy.data.objects.new("Preview camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (5.7, -7.4, 3.25)
    direction = Vector((0.0, -0.16, 0.55)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = camera


def export_and_render(root):
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    # Export only the production asset; preview stage never enters the game.
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )

    add_preview_stage()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    reset_scene()
    sofa_root = build_sofa()
    export_and_render(sofa_root)
    print(f"Exported {GLB_PATH}")
    print(f"Rendered {PREVIEW_PATH}")
