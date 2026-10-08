"""Geometry, material and bookkeeping helpers for the DearV Blender build."""
from __future__ import annotations

import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

TEX_DIR = ""  # set by main.py

# Bookkeeping consumed by bake/export -------------------------------------
COLLIDERS: list[dict] = []          # axis-aligned XY boxes in Blender space
LIGHTMAP_GROUPS: dict[str, list] = {"arch": [], "furn": [], "suite": [], "study": []}
TILES: dict[str, tuple[float, float]] = {}  # material name -> UV tile size (m)
NIGHT_EMITTERS: dict[str, float] = {}       # material name -> night emission strength
_MATS: dict[str, bpy.types.Material] = {}


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    COLLIDERS.clear()
    for k in LIGHTMAP_GROUPS:
        LIGHTMAP_GROUPS[k].clear()
    TILES.clear()
    NIGHT_EMITTERS.clear()
    _MATS.clear()


def collection(name: str) -> bpy.types.Collection:
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c


# Materials ----------------------------------------------------------------
def _img(name: str, non_color=False):
    path = os.path.join(TEX_DIR, name + ".png")
    img = bpy.data.images.get(name + ".png") or bpy.data.images.load(path, check_existing=True)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


def material(
    name: str,
    color=(0.8, 0.8, 0.8),
    rough=0.5,
    metal=0.0,
    albedo: str | None = None,
    normal: str | None = None,
    rough_map: str | None = None,
    tile=(1.0, 1.0),
    normal_strength=0.6,
    emission=None,
    emission_strength=0.0,
    night_emission=0.0,
    transmission=0.0,
    alpha=1.0,
    sheen=0.0,
    coat=0.0,
):
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1.0)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    uvn = None
    if albedo or rough_map or normal:
        uvn = nt.nodes.new("ShaderNodeUVMap")
        uvn.uv_map = "UVMap"
    if albedo:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = _img(albedo)
        nt.links.new(uvn.outputs["UV"], t.inputs["Vector"])
        if tuple(round(c, 3) for c in color) != (0.8, 0.8, 0.8):
            # tinted texture: multiply in Blender (bake), and pass the tint to three.js via extras
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            nt.links.new(t.outputs["Color"], mix.inputs["A"])
            mix.inputs["B"].default_value = (*color, 1.0)
            nt.links.new(mix.outputs["Result"], p.inputs["Base Color"])
            m["tint"] = list(color)
        else:
            nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    if rough_map:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = _img(rough_map, True)
        nt.links.new(uvn.outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], p.inputs["Roughness"])
    if normal:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = _img(normal, True)
        nt.links.new(uvn.outputs["UV"], t.inputs["Vector"])
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = normal_strength
        nt.links.new(t.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    if emission is not None:
        m["emit_color"] = list(emission)
        p.inputs["Emission Color"].default_value = (*emission, 1.0)
        p.inputs["Emission Strength"].default_value = emission_strength
    if night_emission:
        NIGHT_EMITTERS[name] = night_emission
        m["night_emission"] = night_emission
    if transmission:
        p.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1.0:
        p.inputs["Alpha"].default_value = alpha
        m.surface_render_method = "BLENDED"
    if sheen:
        p.inputs["Sheen Weight"].default_value = sheen
    if coat:
        p.inputs["Coat Weight"].default_value = coat
    TILES[name] = tile
    _MATS[name] = m
    return m


def set_emission(mat, strength):
    p = mat.node_tree.nodes.get("Principled BSDF")
    p.inputs["Emission Strength"].default_value = strength


# Mesh creation --------------------------------------------------------------
def _finish(name, bm, mat, loc=(0, 0, 0), rot=(0, 0, 0), parent=None, group="furn",
            smooth=True, angle=35, coll=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=math.radians(angle))
    ob = bpy.data.objects.new(name, me)
    (coll or collection("Interior")).objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    if mat is not None:
        me.materials.append(mat)
    if parent is not None:
        bpy.context.view_layer.update()
        mw = ob.matrix_world.copy()
        ob.parent = parent
        ob.matrix_world = mw
    if group:
        LIGHTMAP_GROUPS[group].append(ob)
        ob["lm"] = group
    return ob


def box(name, size, loc, mat, bevel=0.0, segs=2, rot=(0, 0, 0), parent=None,
        group="furn", collide=False, profile=0.5, coll=None):
    """Bevelled box centred on loc (size = full extents)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.verts[:] + bm.edges[:], offset=min(bevel, min(size) * 0.49),
                        segments=segs, affect="EDGES", profile=profile)
    ob = _finish(name, bm, mat, loc, rot, parent, group, coll=coll)
    if collide:
        add_collider_from(ob)
    return ob


def cushion(name, size, loc, mat, puff=0.35, rot=(0, 0, 0), parent=None, group="furn"):
    """Soft upholstered block: heavy bevel + gentle top bulge."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    r = min(size) * puff
    bmesh.ops.bevel(bm, geom=bm.verts[:] + bm.edges[:], offset=r, segments=5, affect="EDGES", profile=0.55)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if e.calc_length() > 0.18], cuts=2, use_grid_fill=True)
    sx, sy, sz = size
    for v in bm.verts:
        # bulge faces outward a touch
        nx, ny, nz = v.co.x / (sx / 2), v.co.y / (sy / 2), v.co.z / (sz / 2)
        f = max(0.0, 1 - (nx * nx + ny * ny) * 0.9)
        if v.co.z > 0:
            v.co.z += f * sz * 0.08
        else:
            v.co.z -= f * sz * 0.02
    return _finish(name, bm, mat, loc, rot, parent, group, angle=60)


def cylinder(name, r, h, loc, mat, segs=32, r2=None, rot=(0, 0, 0), parent=None,
             group="furn", bevel=0.0, collide=False, smooth_angle=35, coll=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs,
                          radius1=r, radius2=r if r2 is None else r2, depth=h)
    if bevel > 0:
        caps = [e for e in bm.edges if all(abs(abs(v.co.z) - h / 2) < 1e-5 for v in e.verts)
                and abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6
                and (e.verts[0].co.xy.length > (min(r, r2 or r) * 0.9))]
        bmesh.ops.bevel(bm, geom=caps, offset=bevel, segments=3, affect="EDGES", profile=0.5)
    ob = _finish(name, bm, mat, loc, rot, parent, group, angle=smooth_angle, coll=coll)
    if collide:
        add_collider_from(ob)
    return ob


def sphere(name, r, loc, mat, scale=(1, 1, 1), segs=24, rot=(0, 0, 0), parent=None, group="furn", coll=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=max(8, segs // 2), radius=r)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    return _finish(name, bm, mat, loc, rot, parent, group, angle=80, coll=coll)


def extrude_poly(name, pts, height, loc, mat, bevel=0.0, rot=(0, 0, 0), parent=None, group="furn"):
    """Extrude a closed XY polygon upward by height."""
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, 0)) for x, y in pts]
    face = bm.faces.new(verts)
    if face.normal.z < 0:
        face.normal_flip()
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, height), verts=top)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, affect="EDGES", profile=0.5)
    return _finish(name, bm, mat, loc, rot, parent, group)


def rounded_rect(w, d, r, n=8):
    pts = []
    corners = [(w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90),
               (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)]
    for cx, cy, a0 in corners:
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def ellipse(rx, ry, n=48):
    return [(rx * math.cos(2 * math.pi * i / n), ry * math.sin(2 * math.pi * i / n)) for i in range(n)]


def tube(name, points, radius, mat, parent=None, group="furn", res=12):
    """Swept circular tube along a polyline/bezier of points (Blender space)."""
    cu = bpy.data.curves.new(name + "_c", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 4
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, co in zip(sp.points, points):
        p.co = (*co, 1)
    tmp = bpy.data.objects.new(name + "_tmp", cu)
    bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    bm = bmesh.new()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    return _finish(name, bm, mat, (0, 0, 0), (0, 0, 0), parent, group, angle=70)


def empty(name, loc, parent=None, coll=None, **props):
    e = bpy.data.objects.new(name, None)
    (coll or collection("Interior")).objects.link(e)
    e.location = loc
    e.empty_display_size = 0.2
    if parent is not None:  # keep the given world position
        bpy.context.view_layer.update()
        mw = e.matrix_world.copy()
        e.parent = parent
        e.matrix_world = mw
    for k, v in props.items():
        e[k] = v
    return e


def add_collider(minx, miny, maxx, maxy, kind="solid"):
    COLLIDERS.append({"min": [minx, miny], "max": [maxx, maxy], "kind": kind})


def add_collider_from(ob, pad=0.0):
    bpy.context.view_layer.update()
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    add_collider(min(p.x for p in pts) - pad, min(p.y for p in pts) - pad,
                 max(p.x for p in pts) + pad, max(p.y for p in pts) + pad)


def collider_for_group(objs, pad=0.05):
    bpy.context.view_layer.update()
    pts = []
    for ob in objs:
        if ob.type == "MESH":
            pts += [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    add_collider(min(p.x for p in pts) - pad, min(p.y for p in pts) - pad,
                 max(p.x for p in pts) + pad, max(p.y for p in pts) + pad)


# UVs ---------------------------------------------------------------------------
def box_project_uv(ob, tile=None, layer="UVMap"):
    """World-space triplanar-style box projection for tiling textures."""
    if ob.type != "MESH" or not ob.data.materials:
        return
    mat = ob.data.materials[0]
    tu, tv = tile or TILES.get(mat.name if mat else "", (1.0, 1.0))
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.get(layer) or bm.loops.layers.uv.new(layer)
    mw = ob.matrix_world
    rot = mw.to_3x3().normalized()
    for f in bm.faces:
        n = rot @ f.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for loop in f.loops:
            co = mw @ loop.vert.co
            if az >= ax and az >= ay:
                u, v = co.x, co.y
            elif ax >= ay:
                u, v = co.y, co.z
            else:
                u, v = co.x, co.z
            loop[uv].uv = (u / tu, v / tv)
    bm.to_mesh(me)
    bm.free()


def multi_box(name, boxes, mat, bevel=0.0, segs=1, parent=None, group="furn"):
    """Many boxes merged into one mesh. boxes = [(size, loc), ...]."""
    bm = bmesh.new()
    for size, loc in boxes:
        tmp = bmesh.new()
        bmesh.ops.create_cube(tmp, size=1.0)
        bmesh.ops.scale(tmp, vec=Vector(size), verts=tmp.verts)
        if bevel > 0:
            bmesh.ops.bevel(tmp, geom=tmp.verts[:] + tmp.edges[:], offset=min(bevel, min(size) * 0.45),
                            segments=segs, affect="EDGES", profile=0.5)
        bmesh.ops.translate(tmp, vec=Vector(loc), verts=tmp.verts)
        me = bpy.data.meshes.new("_tmp")
        tmp.to_mesh(me)
        tmp.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    return _finish(name, bm, mat, (0, 0, 0), (0, 0, 0), parent, group)


def placed(fn, *args, loc=(0.0, 0.0, 0.0), rot=0.0, name=None, **kw):
    """Build a group with `fn` in its own coordinates, then rotate it about Z (degrees,
    around the world origin) and move it by `loc`. Objects, bake lights and colliders follow."""
    before = set(bpy.data.objects)
    ncol = len(COLLIDERS)
    out = fn(*args, **kw)
    bpy.context.view_layer.update()
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(name or f"placed_{fn.__name__}", None)
    collection("Interior").objects.link(root)
    for o in new:
        if o.parent is None:
            mw = o.matrix_world.copy()
            o.parent = root
            o.matrix_world = mw
    root.rotation_euler.z = math.radians(rot)
    root.location = (loc[0], loc[1], loc[2] if len(loc) > 2 else 0.0)
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    for col in COLLIDERS[ncol:]:
        (x0, y0), (x1, y1) = col["min"], col["max"]
        pts = [(x * c - y * s + loc[0], x * s + y * c + loc[1]) for x in (x0, x1) for y in (y0, y1)]
        col["min"] = [min(p[0] for p in pts), min(p[1] for p in pts)]
        col["max"] = [max(p[0] for p in pts), max(p[1] for p in pts)]
    bpy.context.view_layer.update()
    return out
