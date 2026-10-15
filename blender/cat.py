"""布丁 — a male seal-colorpoint Ragdoll, about three and a half, built procedurally.

A skin-modifier body over a hand-placed skeleton (big fluffy body, ruff, plumed tail),
rigged with automatic weights; ears, blue eyes and a nose pad. The colorpoint pattern is
painted into vertex colours (cream body, seal-brown mask, ears, legs and tail). three.js
renders the fur as translucent shells (web/src/pudding.ts).

Usage:  python blender/cat.py --out web/public/assets
"""
from __future__ import annotations

import argparse
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

# skeleton nodes (metres, he faces -Y): name -> (position, skin radius x, radius y)
NODES = {
    "pelvis": ((0, 0.17, 0.25), 0.12, 0.125),
    "spine1": ((0, 0.06, 0.27), 0.13, 0.13),
    "spine2": ((0, -0.06, 0.275), 0.13, 0.135),
    "chest": ((0, -0.17, 0.27), 0.12, 0.13),
    "neck": ((0, -0.25, 0.32), 0.1, 0.1),
    "head": ((0, -0.31, 0.37), 0.085, 0.08),
    "muzzle": ((0, -0.385, 0.35), 0.04, 0.035),
    "tail1": ((0, 0.27, 0.27), 0.05, 0.05),
    "tail2": ((0, 0.36, 0.3), 0.055, 0.055),
    "tail3": ((0, 0.44, 0.35), 0.06, 0.06),
    "tail4": ((0, 0.5, 0.42), 0.06, 0.06),
    "tail5": ((0, 0.53, 0.5), 0.045, 0.045),
}
for s, x in (("L", 0.065), ("R", -0.065)):
    NODES.update({
        f"shoulder.{s}": ((x, -0.18, 0.2), 0.055, 0.055),
        f"elbow.{s}": ((x, -0.19, 0.11), 0.036, 0.036),
        f"wrist.{s}": ((x, -0.19, 0.04), 0.03, 0.03),
        f"paw.{s}": ((x, -0.215, 0.014), 0.032, 0.026),
        f"hip.{s}": ((x * 1.05, 0.16, 0.19), 0.065, 0.065),
        f"knee.{s}": ((x * 1.05, 0.21, 0.1), 0.04, 0.04),
        f"ankle.{s}": ((x * 1.05, 0.17, 0.04), 0.03, 0.03),
        f"hpaw.{s}": ((x * 1.05, 0.145, 0.014), 0.032, 0.026),
    })
EDGES = [("pelvis", "spine1"), ("spine1", "spine2"), ("spine2", "chest"), ("chest", "neck"), ("neck", "head"),
         ("head", "muzzle"), ("pelvis", "tail1"), ("tail1", "tail2"), ("tail2", "tail3"), ("tail3", "tail4"),
         ("tail4", "tail5")]
for s in "LR":
    EDGES += [("chest", f"shoulder.{s}"), (f"shoulder.{s}", f"elbow.{s}"), (f"elbow.{s}", f"wrist.{s}"),
              (f"wrist.{s}", f"paw.{s}"), ("pelvis", f"hip.{s}"), (f"hip.{s}", f"knee.{s}"),
              (f"knee.{s}", f"ankle.{s}"), (f"ankle.{s}", f"hpaw.{s}")]
# bones: (name, head node, tail node, parent)
BONES = [("root", "spine1", "pelvis", None), ("spine", "spine1", "spine2", "root"), ("chest", "spine2", "chest", "spine"),
         ("neck", "chest", "neck", "chest"), ("head", "neck", "head", "neck"), ("muzzle", "head", "muzzle", "head"),
         ("pelvis", "spine1", "pelvis", "root"),
         ("tail1", "pelvis", "tail1", "pelvis"), ("tail2", "tail1", "tail2", "tail1"), ("tail3", "tail2", "tail3", "tail2"),
         ("tail4", "tail3", "tail4", "tail3"), ("tail5", "tail4", "tail5", "tail4")]
for s in "LR":
    BONES += [(f"upperarm.{s}", f"shoulder.{s}", f"elbow.{s}", "chest"), (f"forearm.{s}", f"elbow.{s}", f"wrist.{s}", f"upperarm.{s}"),
              (f"frontpaw.{s}", f"wrist.{s}", f"paw.{s}", f"forearm.{s}"),
              (f"thigh.{s}", f"hip.{s}", f"knee.{s}", "pelvis"), (f"shin.{s}", f"knee.{s}", f"ankle.{s}", f"thigh.{s}"),
              (f"hindpaw.{s}", f"ankle.{s}", f"hpaw.{s}", f"shin.{s}")]

CREAM = (0.93, 0.87, 0.78)
SEAL = (0.2, 0.13, 0.09)
WHITE = (0.97, 0.95, 0.92)


def build(out):
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    coll = bpy.data.collections.new("Cat")
    bpy.context.scene.collection.children.link(coll)
    # metaball body: capsules along the skeleton blend into one soft, fluffy form
    mb = bpy.data.metaballs.new("pudding_mb")
    mb.resolution = 0.008
    mb.render_resolution = 0.008
    mb.threshold = 0.6
    mbo = bpy.data.objects.new("pudding_mb", mb)
    coll.objects.link(mbo)
    for a, b in EDGES:
        pa, pb = Vector(NODES[a][0]), Vector(NODES[b][0])
        ra, rb = NODES[a][1], NODES[b][1]
        n = max(2, int((pb - pa).length / 0.025))
        for k in range(n + 1):
            t = k / n
            el = mb.elements.new(type="BALL")
            el.co = pa.lerp(pb, t)
            el.radius = (ra * (1 - t) + rb * t) * 1.25
            el.stiffness = 2.0
    for n_, (pos, rx, ry) in NODES.items():
        el = mb.elements.new(type="ELLIPSOID")
        el.co = Vector(pos)
        el.size_x, el.size_y, el.size_z = rx * 0.9, ry * 0.9, ry * 0.85
        el.radius = 1.0
        el.stiffness = 2.0
    bpy.context.view_layer.objects.active = mbo
    mbo.select_set(True)
    bpy.ops.object.convert(target="MESH")
    body = bpy.context.active_object
    body.name = "pudding_body"
    rm = body.modifiers.new("remesh", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = 0.009
    sm = body.modifiers.new("smooth", "SMOOTH")
    sm.iterations = 6
    bpy.ops.object.modifier_apply(modifier="remesh")
    bpy.ops.object.modifier_apply(modifier="smooth")
    body.data.shade_smooth()
    # fluff: a deeper ruff round the chest, a fuller tail, a softer belly
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.normal_update()
    neck = Vector(NODES["neck"][0])
    chest = Vector(NODES["chest"][0])
    for v in bm.verts:
        p = v.co
        d_ruff = (p - (neck + chest) / 2).length
        if d_ruff < 0.14:
            v.co += v.normal * 0.025 * (1 - d_ruff / 0.14)
        if p.y > 0.25 and p.z > 0.22:      # plume
            v.co += v.normal * 0.012
        if p.z < 0.19 and -0.15 < p.y < 0.15 and abs(p.x) < 0.09:   # belly fluff
            v.co.z -= 0.012
    bm.to_mesh(body.data)
    bm.free()

    # ears, eyes, nose: separate pieces joined into the body mesh
    head = Vector(NODES["head"][0])
    def cone(name, base, tip, r):
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=r, depth=(tip - base).length, location=(base + tip) / 2)
        o = bpy.context.active_object
        o.name = name
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference((tip - base).normalized())
        return o
    pieces = []
    for s in (1, -1):
        b = head + Vector((s * 0.045, 0.005, 0.055))
        pieces.append(cone(f"ear_{s}", b, b + Vector((s * 0.02, 0.005, 0.06)), 0.032))
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.017,
                                             location=head + Vector((s * 0.032, -0.07, 0.012)))
        e = bpy.context.active_object
        e.name = f"eye_{s}"
        e.scale = (1, 0.7, 0.85)
        pieces.append(e)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.009,
                                         location=Vector(NODES["muzzle"][0]) + Vector((0, -0.036, 0.01)))
    nose = bpy.context.active_object
    nose.name = "nose"
    pieces.append(nose)
    eye_mat = bpy.data.materials.new("pudding_eye")
    eye_mat.diffuse_color = (0.25, 0.55, 0.95, 1)
    fur_mat = bpy.data.materials.new("pudding_fur")
    fur_mat.diffuse_color = (*CREAM, 1)
    body.data.materials.append(fur_mat)
    body.data.materials.append(eye_mat)
    for p in pieces:
        bpy.context.view_layer.objects.active = p
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        p.data.materials.clear()
        p.data.materials.append(fur_mat)
        p.data.materials.append(eye_mat)
        if p.name.startswith("eye"):
            for poly in p.data.polygons:
                poly.material_index = 1
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for p in pieces:
        p.select_set(True)
        if p.users_collection and p.users_collection[0] != coll:
            p.users_collection[0].objects.unlink(p)
            coll.objects.link(p)
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()

    # colorpoint pattern in vertex colours
    me = body.data
    col = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    muzzle = Vector(NODES["muzzle"][0])
    for v in me.vertices:
        p = v.co
        k = 0.0
        # mask: the face from the muzzle up past the eyes, darkest at the nose
        d = (p - muzzle).length
        if p.y < head.y - 0.015 and p.z > head.z - 0.09:
            # seal mask over the whole face, fading out towards the forehead and cheeks
            k = max(k, min(1.0, 1.35 - d / 0.085))
        if p.z > head.z + 0.04 and abs(p.y - head.y) < 0.05:     # ears
            k = max(k, min(1.0, (p.z - head.z - 0.04) / 0.02))
        if p.y > 0.3:                                             # tail, darker towards the tip
            k = max(k, min(1.0, (p.y - 0.3) / 0.12))
        if p.z < 0.13 and abs(p.x) > 0.03:                        # legs from the elbows / hocks down
            k = max(k, min(1.0, (0.13 - p.z) / 0.06))
        if p.z < 0.035 and p.y < -0.19 and abs(p.x) > 0.03:       # Ragdolls often keep pale toes: a hint of mitts
            k *= 0.75
        base = list(WHITE) if (abs(p.x) < 0.07 and -0.3 < p.y < -0.12 and p.z < 0.3) else list(CREAM)
        c = [base[i] * (1 - k) + SEAL[i] * k for i in range(3)]
        col.data[v.index].color = (*c, 1.0)

    # armature + automatic weights
    arm_data = bpy.data.armatures.new("pudding_rig")
    arm = bpy.data.objects.new("pudding", arm_data)
    coll.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    for n, h, t, p in BONES:
        e = arm_data.edit_bones.new(n)
        e.head = Vector(NODES[h][0])
        e.tail = Vector(NODES[t][0])
        if p:
            e.parent = eb[p]
        eb[n] = e
    bpy.ops.object.mode_set(mode="OBJECT")
    for o in bpy.context.selected_objects:
        o.select_set(False)
    body.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    body.name = "pudding_mesh"

    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children["Cat"]
    path = os.path.join(out, "pudding.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_active_collection=True, export_yup=True,
                              export_skins=True, export_animations=False, export_materials="EXPORT",
                              export_vertex_color="ACTIVE", export_texcoords=False, export_normals=True,
                              export_lights=False, export_cameras=False)
    print(f"[cat] {len(me.vertices)} verts -> {path} ({os.path.getsize(path) / 1e3:.0f} kB)")


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "..", "web", "public", "assets"))
    ap.add_argument("--blend", default="")
    a = ap.parse_args(argv)
    build(os.path.abspath(a.out))
    if a.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.blend))
