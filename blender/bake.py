"""Lightmap UV generation, Cycles irradiance baking and lightmap encoding."""
from __future__ import annotations

import math
import os

import bpy
import numpy as np
from PIL import Image

import lib


def _unwrap_each(objs):
    for ob in objs:
        me = ob.data
        lm = me.uv_layers.get("Lightmap") or me.uv_layers.new(name="Lightmap")
        me.uv_layers["UVMap"].active_render = True
        me.uv_layers.active = lm
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.02, area_weight=0.0,
                                 correct_aspect=True, scale_to_bounds=False)
        bpy.ops.object.mode_set(mode="OBJECT")


def _shelf_pack(cells, gap):
    """cells: list of (w, h). Returns positions or None if they overflow the unit square."""
    order = sorted(range(len(cells)), key=lambda i: -cells[i][1])
    pos = [None] * len(cells)
    x = y = 0.0
    shelf_h = 0.0
    for i in order:
        w, h = cells[i]
        if w + gap > 1.0 or h + gap > 1.0:
            return None
        if x + w + gap > 1.0:
            x = 0.0
            y += shelf_h + gap
            shelf_h = 0.0
        if y + h + gap > 1.0:
            return None
        pos[i] = (x + gap / 2, y + gap / 2)
        x += w + gap
        shelf_h = max(shelf_h, h)
    return pos


def lightmap_uvs(objs, res=2048, margin_px=6):
    """Unwrap each object, then pack whole objects into one atlas with uniform texel density."""
    objs = [o for o in objs if o.type == "MESH"]
    _unwrap_each(objs)
    info = []
    for ob in objs:
        me = ob.data
        uv = me.uv_layers["Lightmap"]
        a = np.zeros(len(uv.data) * 2)
        uv.data.foreach_get("uv", a)
        a = a.reshape(-1, 2)
        lo, hi = a.min(0), a.max(0)
        # uv-space and world-space surface areas
        uv_area = 0.0
        world_area = 0.0
        mw = ob.matrix_world
        for poly in me.polygons:
            idx = list(poly.loop_indices)
            pts = a[idx]
            x, y = pts[:, 0], pts[:, 1]
            uv_area += 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))
            world_area += (mw.to_3x3() @ poly.normal).length * 0 + poly.area
        info.append((ob, a, lo, np.maximum(hi - lo, 1e-6), max(uv_area, 1e-9), max(world_area, 1e-6)))
    gap = margin_px * 2.0 / res
    lo_k, hi_k = 1e-6, 10.0
    best = None
    for _ in range(40):
        k = (lo_k + hi_k) / 2
        cells = []
        for ob, a, lo, size, ua, wa in info:
            s = math.sqrt(k * wa / ua)
            cells.append((size[0] * s, size[1] * s))
        pos = _shelf_pack(cells, gap)
        if pos is None:
            hi_k = k
        else:
            lo_k = k
            best = (cells, pos)
    cells, pos = best
    for (ob, a, lo, size, ua, wa), (cw, ch), (px, py) in zip(info, cells, pos):
        b = (a - lo) / size * np.array([cw, ch]) + np.array([px, py])
        ob.data.uv_layers["Lightmap"].data.foreach_set("uv", b.ravel())
    used = sum(c[0] * c[1] for c in cells)
    print(f"[dearv] packed {len(objs)} objects, atlas fill {used:.2f}, "
          f"density {math.sqrt(lo_k) * res:.0f} px/m")


def configure_cycles(samples):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 4
    sc.cycles.glossy_bounces = 1
    sc.cycles.transmission_bounces = 2
    sc.cycles.transparent_max_bounces = 4
    sc.cycles.sample_clamp_indirect = 8.0
    sc.render.bake.margin = 6
    sc.render.bake.margin_type = "EXTEND"


def setup_world(mode):
    w = bpy.data.worlds.get("BakeWorld") or bpy.data.worlds.new("BakeWorld")
    bpy.context.scene.world = w
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    if mode == "day":
        # bright overcast-blue sky dome; the sun provides the hard key
        bg.inputs["Color"].default_value = (0.55, 0.7, 0.95, 1)
        bg.inputs["Strength"].default_value = 1.6
    else:
        bg.inputs["Color"].default_value = (0.05, 0.07, 0.14, 1)
        bg.inputs["Strength"].default_value = 0.25


def ensure_sun():
    sun = bpy.data.objects.get("BakeSun")
    if sun is None:
        ld = bpy.data.lights.new("BakeSun", "SUN")
        ld.energy = 4.0
        ld.angle = math.radians(1.2)
        ld.color = (1.0, 0.95, 0.88)
        sun = bpy.data.objects.new("BakeSun", ld)
        lib.collection("BakeLights").objects.link(sun)
        # Afternoon sun coming in over the harbour (from +Y, slightly west)
        sun.rotation_euler = (math.radians(-55), 0, math.radians(20))
    return sun


def set_mode(mode, night_lights, hide_always):
    sun = ensure_sun()
    sun.hide_render = mode != "day"
    for ob in night_lights:
        ob.hide_render = mode == "day"
    for ob in hide_always:
        ob.hide_render = True
    for name, strength in lib.NIGHT_EMITTERS.items():
        m = bpy.data.materials.get(name)
        if m and not name.startswith("facade") and name != "near_tower":
            lib.set_emission(m, strength if mode == "night" else 0.0)
    setup_world(mode)


def bake_group(objs, name, res):
    """Bake irradiance for a lightmap group.

    The group is duplicated and joined into one temporary mesh first: Cycles has
    a large per-object overhead when baking hundreds of selected objects, while
    the joined copy shares the exact same Lightmap UVs as the originals.
    """
    objs = [o for o in objs if o.type == "MESH"]
    img = bpy.data.images.get(name) or bpy.data.images.new(name, res, res, float_buffer=True, alpha=False)
    mats = {s.material for o in objs for s in o.material_slots if s.material}
    for m in mats:
        nt = m.node_tree
        n = nt.nodes.get("__bake") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "__bake"
        n.image = img
        nt.nodes.active = n
    tmp_coll = lib.collection("__BakeTmp")
    copies = []
    for o in objs:
        me = o.data.copy()
        me.transform(o.matrix_world)
        c = bpy.data.objects.new(o.name + "__bk", me)
        tmp_coll.objects.link(c)
        copies.append(c)
        o.hide_render = True
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    for c in copies:
        c.select_set(True)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.data.uv_layers.active = joined.data.uv_layers["Lightmap"]
    joined.data.uv_layers["UVMap"].active_render = True
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True,
                        target="IMAGE_TEXTURES")
    px = np.array(img.pixels[:], dtype=np.float32).reshape(res, res, 4)[..., :3]
    me = joined.data
    bpy.data.objects.remove(joined)
    bpy.data.meshes.remove(me)
    for o in objs:
        o.hide_render = False
    return px


def remove_bake_nodes():
    for m in bpy.data.materials:
        if m.node_tree and (n := m.node_tree.nodes.get("__bake")):
            m.node_tree.nodes.remove(n)


def _blur(a, sigma):
    r = int(sigma * 3)
    k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * sigma * sigma))
    k /= k.sum()
    out = a.copy()
    for axis in (0, 1):
        acc = np.zeros_like(out)
        for i, w in enumerate(k):
            acc += w * np.roll(out, i - r, axis=axis)
        out = acc
    return out


def denoise(px):
    """Intel Open Image Denoise through Blender's compositor (needs libEGL);
    falls back to a light gaussian when the compositor is unavailable."""
    try:
        return _oidn(px)
    except Exception as exc:  # pragma: no cover - environment dependent
        print("[dearv] OIDN unavailable, using gaussian smoothing:", exc)
        return _blur(px, 1.5)


def _oidn(px):
    import tempfile
    res = px.shape[0]
    sc = bpy.data.scenes.get("__denoise") or bpy.data.scenes.new("__denoise")
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 1
    sc.cycles.device = "CPU"
    sc.render.resolution_x = sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "OPEN_EXR"
    sc.render.image_settings.color_depth = "32"
    if sc.camera is None:
        cam = bpy.data.objects.new("__dn_cam", bpy.data.cameras.new("__dn_cam"))
        sc.collection.objects.link(cam)
        sc.camera = cam
    img = bpy.data.images.get("__dn_in") or bpy.data.images.new("__dn_in", res, res, float_buffer=True, alpha=False)
    if img.size[0] != res:
        img.scale(res, res)
    img.colorspace_settings.name = "Non-Color"
    img.pixels.foreach_set(np.dstack([px, np.ones(px.shape[:2] + (1,), np.float32)]).astype(np.float32).ravel())
    ng = bpy.data.node_groups.get("__dn_tree")
    if ng is None:
        ng = bpy.data.node_groups.new("__dn_tree", "CompositorNodeTree")
        ng.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        n_img = ng.nodes.new("CompositorNodeImage")
        n_img.name = "in"
        n_dn = ng.nodes.new("CompositorNodeDenoise")
        n_out = ng.nodes.new("NodeGroupOutput")
        ng.links.new(n_img.outputs["Image"], n_dn.inputs["Image"])
        ng.links.new(n_dn.outputs["Image"], n_out.inputs[0])
    ng.nodes["in"].image = img
    sc.compositing_node_group = ng
    sc.view_settings.view_transform = "Standard"
    path = os.path.join(tempfile.gettempdir(), "dearv_dn.exr")
    sc.render.filepath = path
    with bpy.context.temp_override(scene=sc):
        bpy.ops.render.render(write_still=True, scene=sc.name)
    out = bpy.data.images.load(path, check_existing=False)
    out.colorspace_settings.name = "Non-Color"
    a = np.array(out.pixels[:], dtype=np.float32).reshape(res, res, -1)[..., :3]
    bpy.data.images.remove(out)
    return np.maximum(a, 0)


def encode(px, path):
    """sqrt-encode linear irradiance into 8-bit with a per-map scale."""
    peak = float(np.percentile(px.max(axis=2), 99.7))
    scale = max(peak, 1e-3) * 1.05
    enc = np.sqrt(np.clip(px / scale, 0, 1))
    img = (np.flipud(enc) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(img, "RGB").save(path, "WEBP", quality=92, method=6)
    return scale
