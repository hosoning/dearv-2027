"""Build the first reference-based DearV memory gifts as authored GLBs.

These are based on the user's product photos:
- 520 flower hatbox: roses are the closed-state hero; the gold 520 medal is revealed on open.
- Christmas music lantern: antique bronze lantern shell with a glowing village, tree and snow inside.

Run with:
  blender --background --python game/tools/build_memory_gifts.py
"""
from __future__ import annotations

import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "game" / "assets" / "models"
PREVIEW_DIR = ROOT / "game" / "assets" / "previews"


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(blocks):
            if block.users == 0:
                blocks.remove(block)


def _gift_pattern(name: str) -> str:
    lowered = name.lower()
    if any(word in lowered for word in ("gold", "bronze")):
        return "metal"
    if any(word in lowered for word in ("satin", "ribbon", "velvet", "rose", "hatbox", "rim")):
        return "fabric"
    if any(word in lowered for word in ("evergreen", "roof", "snow")):
        return "subtle"
    return "smooth"


def mat(name, color, rough=0.55, metal=0.0, emission=None, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color[:3], alpha)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    links = m.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color[:3], alpha)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'DITHERED'
        elif hasattr(m, 'blend_method'):
            m.blend_method = 'BLEND'
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission[3]

    # Glass and emissive glow stay clean; everything else gets subtle
    # procedural variation so it doesn't read as flat painted plastic.
    if alpha < 1.0 or emission:
        return m

    pattern = _gift_pattern(name)
    tex_coord = nodes.new("ShaderNodeTexCoord")
    grain_scale = {"metal": 55.0, "fabric": 30.0, "subtle": 12.0, "smooth": 18.0}[pattern]

    color_noise = nodes.new("ShaderNodeTexNoise")
    color_noise.inputs["Scale"].default_value = grain_scale
    color_noise.inputs["Detail"].default_value = 4.0
    color_noise.inputs["Roughness"].default_value = 0.6
    links.new(tex_coord.outputs["Object"], color_noise.inputs["Vector"])

    color_ramp = nodes.new("ShaderNodeValToRGB")
    spread = 0.05 if pattern in ("fabric", "subtle") else 0.03
    color_ramp.color_ramp.elements[0].position = 0.4
    color_ramp.color_ramp.elements[0].color = (
        max(0.0, color[0] * (1 - spread)),
        max(0.0, color[1] * (1 - spread)),
        max(0.0, color[2] * (1 - spread)),
        1.0,
    )
    color_ramp.color_ramp.elements[1].position = 0.6
    color_ramp.color_ramp.elements[1].color = (
        min(1.0, color[0] * (1 + spread) + 0.015),
        min(1.0, color[1] * (1 + spread) + 0.015),
        min(1.0, color[2] * (1 + spread) + 0.015),
        1.0,
    )
    links.new(color_noise.outputs["Fac"], color_ramp.inputs["Fac"])
    links.new(color_ramp.outputs["Color"], bsdf.inputs["Base Color"])

    rough_noise = nodes.new("ShaderNodeTexNoise")
    rough_noise.inputs["Scale"].default_value = grain_scale * 2.5
    rough_map = nodes.new("ShaderNodeMapRange")
    variance = 0.08 if pattern == "metal" else 0.14
    rough_map.inputs["To Min"].default_value = max(0.05, rough - variance)
    rough_map.inputs["To Max"].default_value = min(1.0, rough + variance)
    links.new(tex_coord.outputs["Object"], rough_noise.inputs["Vector"])
    links.new(rough_noise.outputs["Fac"], rough_map.inputs["Value"])
    links.new(rough_map.outputs["Result"], bsdf.inputs["Roughness"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = {"metal": 0.012, "fabric": 0.05, "subtle": 0.02, "smooth": 0.018}[pattern]
    links.new(color_noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    return m


def root(name):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o["asset_id"] = name.lower()
    return o


def rounded_box(name, location, size, material, parent=None, bevel=0.035, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    o = bpy.context.object
    o.name = name
    o.scale = tuple(v / 2 for v in size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = o.modifiers.new("Soft edge", "BEVEL")
    mod.width = max(0.003, min(bevel, min(size) * 0.35))
    mod.segments = 4
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(material)
    o.parent = parent
    return o


def cyl(name, location, radius, depth, material, parent=None, vertices=64, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    o.parent = parent
    b = o.modifiers.new("Rounded rim", "BEVEL")
    b.width = min(0.018, radius * 0.08)
    b.segments = 3
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=b.name)
    return o


def sphere(name, location, scale, material, parent=None, segments=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(12, segments // 2), location=location)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    o.parent = parent
    return o


def pipe(name, start, end, radius, material, parent=None):
    a, b = Vector(start), Vector(end)
    d = b - a
    o = cyl(name, (a + b) * 0.5, radius, d.length, material, parent, 24)
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return o


def rose(parent, center, pink, dark):
    # Layered petals rather than a single ball: reads as a rose from normal room distance.
    x, y, z = center
    for ring, count in ((0.0, 5), (0.075, 8), (0.135, 11)):
        for i in range(count):
            a = i / count * math.tau
            px = x + math.cos(a) * ring
            py = y + math.sin(a) * ring
            pz = z + 0.015 * math.cos(a * 2)
            s = 0.075 if ring == 0 else 0.09
            petal = sphere("RosePetal", (px, py, pz), (s * 0.8, s, s * 0.34), pink if i % 3 else dark, parent, 20)
            petal.rotation_euler.z = a
    sphere("RoseHeart", (x, y, z + 0.035), (0.07, 0.07, 0.045), dark, parent, 20)


def build_520():
    r = root("DearV_520_Flower_Box")
    cream = mat("Warm cream hatbox", (0.78, 0.69, 0.55), 0.62)
    pattern = mat("Champagne patterned rim", (0.62, 0.50, 0.35), 0.44, 0.16)
    ribbon = mat("Dusty rose satin ribbon", (0.65, 0.31, 0.32), 0.28, 0.02)
    rose_pink = mat("Soft pink rose", (0.82, 0.42, 0.48), 0.82)
    rose_dark = mat("Rose shadow", (0.58, 0.20, 0.26), 0.86)
    gold = mat("520 polished gold", (0.82, 0.58, 0.15), 0.16, 0.92)
    gold_hi = mat("520 raised gold", (1.0, 0.79, 0.30), 0.12, 0.95)
    red = mat("Medal presentation velvet", (0.36, 0.055, 0.045), 0.73)

    cyl("HatboxBase", (0, 0, 0.31), 0.58, 0.62, cream, r)
    cyl("PatternedBaseBand", (0, 0, 0.08), 0.595, 0.16, pattern, r)

    flower_lid = root("FlowerLid")
    flower_lid.parent = r
    cyl("FlowerTray", (0, 0, 0.67), 0.565, 0.10, cream, flower_lid)
    # Dense bouquet based on the photographed closed-state presentation.
    for row, y in enumerate((-0.31, -0.10, 0.11, 0.31)):
        count = 4 if row in (0, 3) else 5
        for col in range(count):
            x = (col - (count - 1) / 2) * 0.21 + (0.05 if row % 2 else 0)
            if x * x + y * y < 0.30:
                rose(flower_lid, (x, y, 0.77 + 0.025 * ((col + row) % 2)), rose_pink, rose_dark)

    # Long satin bow and tails across the bouquet.
    for x in (-0.17, 0.17):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.028, major_segments=48, minor_segments=12, location=(x, -0.05, 1.02), rotation=(math.radians(90), 0, 0))
        loop = bpy.context.object
        loop.name = "RibbonBowLoop"
        loop.scale.x = 1.25
        loop.data.materials.append(ribbon)
        loop.parent = flower_lid
    rounded_box("RibbonKnot", (0, -0.05, 1.02), (0.14, 0.08, 0.09), ribbon, flower_lid, 0.025)
    rounded_box("RibbonTailLeft", (-0.18, -0.03, 0.82), (0.13, 0.035, 0.54), ribbon, flower_lid, 0.018, (0, math.radians(-14), math.radians(6)))
    rounded_box("RibbonTailRight", (0.18, -0.02, 0.80), (0.13, 0.035, 0.58), ribbon, flower_lid, 0.018, (0, math.radians(13), math.radians(-7)))

    # Hidden presentation tray. MemoryGallery moves the flower lid aside when opened.
    coin_reveal = root("CoinReveal")
    coin_reveal.parent = r
    coin_reveal.hide_render = False
    rounded_box("VelvetCoinCradle", (0, 0, 0.64), (0.76, 0.76, 0.07), red, coin_reveal, 0.06)
    cyl("Gold520Medal", (0, 0, 0.72), 0.34, 0.055, gold, coin_reveal, 96)
    # Raised 520 digits use beveled text so the photographed face reads correctly.
    for text, x in (("5", -0.18), ("2", 0.0), ("0", 0.19)):
        curve = bpy.data.curves.new(f"Digit{text}", type="FONT")
        curve.body = text
        curve.align_x = 'CENTER'
        curve.align_y = 'CENTER'
        curve.size = 0.26
        curve.extrude = 0.018
        curve.bevel_depth = 0.006
        obj = bpy.data.objects.new(f"Raised{text}", curve)
        bpy.context.collection.objects.link(obj)
        obj.location = (x, -0.015, 0.758)
        obj.rotation_euler = (0, 0, 0)
        obj.data.materials.append(gold_hi)
        obj.parent = coin_reveal
    for a in range(0, 360, 30):
        rad = math.radians(a)
        sphere("MedalDetail", (math.cos(rad) * 0.27, math.sin(rad) * 0.27, 0.754), (0.012, 0.012, 0.008), gold_hi, coin_reveal, 12)
    coin_reveal["dearv_hidden_when_closed"] = True
    flower_lid["dearv_openable_lid"] = True
    return r


def build_lantern():
    r = root("DearV_Christmas_Music_Lantern")
    bronze = mat("Aged antique bronze", (0.16, 0.095, 0.052), 0.28, 0.72)
    bronze_hi = mat("Bronze rubbed edge", (0.31, 0.18, 0.075), 0.25, 0.78)
    glass = mat("Lantern glass", (0.72, 0.82, 0.84), 0.05, 0.0, alpha=0.18)
    snow = mat("Snow", (0.93, 0.95, 0.94), 0.92)
    green = mat("Christmas evergreen", (0.07, 0.22, 0.11), 0.84)
    red = mat("Village roof", (0.38, 0.08, 0.055), 0.7)
    warm = mat("Window glow", (0.95, 0.58, 0.18), 0.3, emission=(1.0, 0.45, 0.08, 3.6))

    rounded_box("LanternBase", (0, 0, 0.18), (1.10, 0.92, 0.36), bronze, r, 0.06)
    rounded_box("LanternBaseTrim", (0, 0, 0.39), (1.18, 1.0, 0.10), bronze_hi, r, 0.035)
    rounded_box("LanternTop", (0, 0, 1.73), (1.18, 1.0, 0.16), bronze, r, 0.05)
    # Pitched cap.
    for y in (-0.28, 0.28):
        rounded_box("RoofPlate", (0, y, 1.90), (1.22, 0.63, 0.08), bronze, r, 0.025, (math.radians(25 if y < 0 else -25), 0, 0))
    cyl("LanternCap", (0, 0, 2.08), 0.20, 0.18, bronze, r, 48)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.035, major_segments=48, minor_segments=14, location=(0, 0, 2.32), rotation=(math.radians(90), 0, 0))
    ring = bpy.context.object
    ring.name = "CarryRing"
    ring.data.materials.append(bronze)
    ring.parent = r

    for x in (-0.53, 0.53):
        for y in (-0.44, 0.44):
            rounded_box("LanternPost", (x, y, 1.08), (0.09, 0.09, 1.46), bronze_hi, r, 0.025)
    # Four transparent panes.
    rounded_box("FrontGlass", (0, -0.45, 1.08), (0.96, 0.025, 1.34), glass, r, 0.008)
    rounded_box("BackGlass", (0, 0.45, 1.08), (0.96, 0.025, 1.34), glass, r, 0.008)
    rounded_box("LeftGlass", (-0.54, 0, 1.08), (0.025, 0.78, 1.34), glass, r, 0.008)
    rounded_box("RightGlass", (0.54, 0, 1.08), (0.025, 0.78, 1.34), glass, r, 0.008)

    scene = root("LanternScene")
    scene.parent = r
    rounded_box("SnowFloor", (0, 0, 0.54), (0.94, 0.73, 0.10), snow, scene, 0.045)
    # Central tree with layered foliage.
    for i, (z, radius) in enumerate(((0.72, 0.34), (0.92, 0.28), (1.10, 0.21), (1.26, 0.14))):
        bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=radius, radius2=0.02, depth=0.34, location=(0.06, 0.02, z))
        cone = bpy.context.object
        cone.name = f"TreeLayer{i}"
        cone.data.materials.append(green)
        cone.parent = scene
    # Two houses with lit windows.
    for x, y, scale in ((-0.29, 0.12, 0.78), (0.31, 0.17, 0.68)):
        rounded_box("VillageHouse", (x, y, 0.72), (0.32 * scale, 0.26 * scale, 0.28 * scale), snow, scene, 0.02)
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.27 * scale, radius2=0, depth=0.23 * scale, location=(x, y, 0.94 * scale + 0.16), rotation=(0, 0, math.radians(45)))
        roof = bpy.context.object
        roof.name = "VillageRoof"
        roof.data.materials.append(red)
        roof.parent = scene
        for wx in (-0.07, 0.07):
            rounded_box("GlowingWindow", (x + wx * scale, y - 0.135 * scale, 0.75), (0.055, 0.018, 0.07), warm, scene, 0.008)

    snow_cluster = root("SnowCluster")
    snow_cluster.parent = r
    for i in range(72):
        a = (i * 137.5) % 360
        radius = 0.12 + 0.34 * ((i * 23) % 17) / 16
        x = math.cos(math.radians(a)) * radius
        y = math.sin(math.radians(a)) * radius * 0.78
        z = 0.62 + ((i * 41) % 100) / 100 * 1.12
        sphere("SnowParticle", (x, y, z), (0.012, 0.012, 0.012), snow, snow_cluster, 10)
    snow_cluster["dearv_snow_cluster"] = True
    scene["dearv_music_scene"] = True
    return r


def descendants(o):
    stack = list(o.children); out = []
    while stack:
        c = stack.pop(); out.append(c); stack.extend(c.children)
    return out


def export(asset_name, asset_root, target, camera_pos):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    asset_root.select_set(True)
    for c in descendants(asset_root): c.select_set(True)
    bpy.context.view_layer.objects.active = asset_root
    bpy.ops.export_scene.gltf(filepath=str(MODEL_DIR / f"{asset_name}.glb"), export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")

    # Preview only; does not alter exported selection.
    bpy.ops.object.camera_add(location=camera_pos)
    cam = bpy.context.object
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    bpy.ops.object.light_add(type='AREA', location=(3.5, -4.0, 5.5)); bpy.context.object.data.energy = 900; bpy.context.object.data.shape = 'DISK'; bpy.context.object.data.size = 4.0
    bpy.ops.object.light_add(type='AREA', location=(-3.0, 1.5, 3.0)); bpy.context.object.data.energy = 420; bpy.context.object.data.size = 3.0
    world = bpy.context.scene.world
    world.color = (0.028, 0.022, 0.019)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if bpy.app.version >= (4, 2, 0) else "BLENDER_EEVEE"
    scene.render.resolution_x = 1000; scene.render.resolution_y = 1000; scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_DIR / f"{asset_name}.png")
    bpy.ops.render.render(write_still=True)


ASSETS = (
    ("gift_520_flower_box", build_520, (0, 0, 0.65), (2.7, -4.0, 2.3)),
    ("christmas_music_lantern", build_lantern, (0, 0, 1.1), (3.5, -5.2, 3.0)),
)

if __name__ == "__main__":
    for name, builder, target, camera in ASSETS:
        reset_scene()
        export(name, builder(), target, camera)
