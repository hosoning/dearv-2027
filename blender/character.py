"""李澤言 — a rigged, dressed human built from the CC0 MakeHuman base mesh.

The body is the MakeHuman hm08 base mesh shaped with its macro targets (young adult man,
tall, athletic, lean), rigged with MakeHuman's default skeleton and weights (face and
toe bones folded into their parents). Clothes are layers grown off the body surface and
skinned with the same weights, so every outfit moves with him:

    suit      jacket + shirt + trousers + dress shoes     (work)
    pajamas   long-sleeve top + long trousers            (the Quin's set she gave him)
    lounge    loose sweatshirt + joggers + slippers        (home)
    casual    oversized tee + open overshirt + wide trousers + sneakers (weekends out)

The body is split into regions (head, torso, arms, hands, legs, feet) so the parts an
outfit covers can be hidden. three.js renders him as a barely-there refraction of the
room (see web/src/lizeyan.ts); materials here only name the layers.

Usage:  python blender/character.py --out web/public/assets
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402  (bpy first: it provides bmesh and mathutils)
import bmesh  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

MH = os.path.join(HERE, "data", "makehuman")
SCALE = 0.1                     # MakeHuman units are decimetres

# macro shape: male, young adult, tall, athletic and lean, East Asian
RACE = {"asian": 0.8, "caucasian": 0.2}
MUSCLE, WEIGHT, HEIGHT, PROPORTIONS = 0.72, 0.4, 0.62, 0.85
STATURE = 1.86                  # metres, top of the head

KEEP = {"root", "spine05", "spine04", "spine03", "spine02", "spine01", "neck01", "neck02", "neck03", "head",
        "pelvis.L", "pelvis.R", "upperleg01.L", "upperleg01.R", "upperleg02.L", "upperleg02.R",
        "lowerleg01.L", "lowerleg01.R", "lowerleg02.L", "lowerleg02.R", "foot.L", "foot.R", "toe1-1.L", "toe1-1.R",
        "clavicle.L", "clavicle.R", "shoulder01.L", "shoulder01.R", "upperarm01.L", "upperarm01.R",
        "upperarm02.L", "upperarm02.R", "lowerarm01.L", "lowerarm01.R", "lowerarm02.L", "lowerarm02.R",
        "wrist.L", "wrist.R", "jaw"}
KEEP |= {f"finger{f}-{k}.{s}" for f in range(1, 6) for k in range(1, 4) for s in "LR"}
KEEP |= {f"metacarpal{f}.{s}" for f in range(1, 5) for s in "LR"}

REGION_OF = {}
for b in ("head", "neck01", "neck02", "neck03", "jaw"):
    REGION_OF[b] = "head"
for b in ("spine01", "spine02", "spine03", "spine04", "clavicle"):
    REGION_OF[b] = "torso"
for b in ("spine05", "root", "pelvis"):
    REGION_OF[b] = "hips"
for b in ("shoulder01", "upperarm01", "upperarm02"):
    REGION_OF[b] = "upperarm"
for b in ("lowerarm01", "lowerarm02"):
    REGION_OF[b] = "forearm"
for b in ("upperleg01", "upperleg02"):
    REGION_OF[b] = "thigh"
for b in ("lowerleg01", "lowerleg02"):
    REGION_OF[b] = "shin"
for b in ("foot", "toe1-1"):
    REGION_OF[b] = "foot"


def region(bone):
    base = bone.split(".")[0]
    if base.startswith(("wrist", "metacarpal", "finger")):
        return "hand"
    return REGION_OF.get(base, "torso")


# ---------------------------------------------------------------------------
def load_obj(path):
    verts, faces, groups = [], [], []
    g = None
    for line in open(path):
        if line.startswith("v "):
            verts.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("g "):
            g = line.split()[1]
        elif line.startswith("f "):
            faces.append([int(t.split("/")[0]) - 1 for t in line.split()[1:]])
            groups.append(g)
    return np.array(verts), faces, groups


def load_target(name):
    idx, d = [], []
    for line in open(os.path.join(MH, "targets", name + ".target")):
        if line.startswith("#") or not line.strip():
            continue
        p = line.split()
        idx.append(int(p[0]))
        d.append([float(p[1]), float(p[2]), float(p[3])])
    return np.array(idx, dtype=int), np.array(d)


def shape_body(V):
    V = V.copy()
    def add(name, w):
        if w <= 1e-6:
            return
        path = os.path.join(MH, "targets", name + ".target")
        if not os.path.exists(path):
            return       # the average/average target is empty (it is the base)
        i, d = load_target(name)
        V[i] += w * d
    for race, w in RACE.items():
        add(f"{race}-male-young", w)
    mw = {"maxmuscle": (MUSCLE - 0.5) * 2, "averagemuscle": 1 - (MUSCLE - 0.5) * 2}
    ww = {"minweight": (0.5 - WEIGHT) * 2, "averageweight": 1 - (0.5 - WEIGHT) * 2}
    for m, a in mw.items():
        for w, b in ww.items():
            add(f"universal-male-young-{m}-{w}", a * b)
            add(f"male-young-{m}-{w}-maxheight", a * b * (HEIGHT - 0.5) * 2)
            add(f"male-young-{m}-{w}-idealproportions", a * b * PROPORTIONS)
    return V


def to_blender(v):
    """MakeHuman (x right, y up, z forward) -> Blender (x, -z, y) in metres; he faces -Y."""
    return np.stack([v[..., 0], -v[..., 2], v[..., 1]], axis=-1) * SCALE


# ---------------------------------------------------------------------------
def build(out_dir):
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    V0, faces, groups = load_obj(os.path.join(MH, "base.obj"))
    V = to_blender(shape_body(V0))
    bodyv = [i for f, g in zip(faces, groups) if g == "body" for i in f]
    V[:, 2] -= V[:, 2][bodyv].min()                       # feet on the floor
    V *= STATURE / V[:, 2][bodyv].max()                   # his height
    skel = json.load(open(os.path.join(MH, "default.mhskel")))
    weights = json.load(open(os.path.join(MH, "default_weights.mhw")))["weights"]
    joint = {n: V[idx].mean(axis=0) for n, idx in skel["joints"].items()}

    body_faces = [f for f, g in zip(faces, groups) if g == "body"]
    used = sorted({i for f in body_faces for i in f})
    remap = {old: new for new, old in enumerate(used)}
    BV = V[used]
    BF = [[remap[i] for i in f] for f in body_faces]
    print(f"[lz] body: {len(BV)} verts, {len(BF)} faces, height {BV[:, 2].max():.3f} m")

    # skeleton: fold dropped bones into their nearest kept ancestor
    bones = skel["bones"]
    def kept(b):
        while b not in KEEP:
            b = bones[b]["parent"]
        return b
    W = {}
    for b, lst in weights.items():
        k = kept(b)
        for vi, w in lst:
            if vi in remap:
                W.setdefault(k, {}).setdefault(remap[vi], 0.0)
                W[k][remap[vi]] += w

    # armature
    arm_data = bpy.data.armatures.new("lizeyan_rig")
    arm = bpy.data.objects.new("lizeyan", arm_data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = {}
    order = [b for b in bones if b in KEEP]
    for b in order:
        e = arm_data.edit_bones.new(b)
        e.head = Vector(joint[bones[b]["head"]])
        e.tail = Vector(joint[bones[b]["tail"]])
        if (e.tail - e.head).length < 1e-4:
            e.tail = e.head + Vector((0, 0, 0.02))
        pl = skel["planes"].get(bones[b].get("rotation_plane") or "", None)
        if pl:
            a, b_, c = (Vector(joint[j]) for j in pl)
            n = (b_ - a).cross(c - b_)
            if n.length > 1e-6:
                e.align_roll(n.normalized())
        eb[b] = e
    for b in order:
        p = bones[b]["parent"]
        while p is not None and p not in KEEP:
            p = bones[p]["parent"]
        if p:
            eb[b].parent = eb[p]
    bpy.ops.object.mode_set(mode="OBJECT")

    # vertex normals of the shaped body (for growing clothes and hair off it)
    N = np.zeros_like(BV)
    for f in BF:
        p = BV[f]
        n = np.cross(p[1] - p[0], p[2] - p[0])
        if len(f) == 4:
            n += np.cross(p[2] - p[0], p[3] - p[0])
        N[f] += n
    N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
    # dominant bone and region per vertex / face
    vb = [None] * len(BV)
    best = np.zeros(len(BV))
    for b, d in W.items():
        for vi, w in d.items():
            if w > best[vi]:
                best[vi], vb[vi] = w, b
    vreg = [region(b or "spine01") for b in vb]
    freg = []
    for f in BF:
        rs = [vreg[i] for i in f]
        freg.append(max(set(rs), key=rs.count))
    _FREG.clear()
    _FREG.update({tuple(f): r for f, r in zip(BF, freg)})

    j = {k: joint[bones[k]["head"]] for k in ("head", "neck01", "spine01", "spine05", "lowerleg01.L", "foot.L",
                                               "lowerarm02.L", "wrist.L", "upperleg01.L", "lowerarm01.L")}
    crotch_z = min(joint[bones["upperleg01.L"]["head"]][2], joint[bones["upperleg01.R"]["head"]][2]) - 0.06
    belt_z = j["spine05"][2] + 0.02
    ankle_z = j["foot.L"][2] + 0.02
    neck_z = j["neck01"][2]

    coll = bpy.data.collections.new("Character")
    bpy.context.scene.collection.children.link(coll)
    arm.users_collection[0].objects.unlink(arm)
    coll.objects.link(arm)

    mats = {}
    def mat(name, color):
        if name not in mats:
            m = bpy.data.materials.new(name)
            m.diffuse_color = (*color, 1)
            p = m.node_tree.nodes.get("Principled BSDF")
            p.inputs["Base Color"].default_value = (*color, 1)
            p.inputs["Roughness"].default_value = 0.6
            mats[name] = m
        return mats[name]

    def make_mesh(name, P, F, material, extra_weights=None, layer=""):
        me = bpy.data.meshes.new(name)
        bm = bmesh.new()
        vs = [bm.verts.new(tuple(p)) for p in P]
        bm.verts.ensure_lookup_table()
        for f in F:
            try:
                bm.faces.new([vs[i] for i in f])
            except ValueError:
                pass
        bm.to_mesh(me)
        bm.free()
        me.shade_smooth()
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        me.materials.append(material)
        ob.parent = arm
        mod = ob.modifiers.new("rig", "ARMATURE")
        mod.object = arm
        if layer:
            ob["layer"] = layer
        return ob

    def skin(ob, vmap):
        """vmap: new vertex index -> body vertex index whose weights it copies."""
        for b in W:
            ob.vertex_groups.new(name=b)
        for nv, bv in enumerate(vmap):
            ws = [(b, d[bv]) for b, d in W.items() if bv in d]
            tot = sum(w for _, w in ws) or 1
            for b, w in sorted(ws, key=lambda t: -t[1])[:4]:
                ob.vertex_groups[b].add([nv], w / tot, "REPLACE")

    # ---- body regions ---------------------------------------------------------------------
    skin_mat = mat("lz_skin", (0.86, 0.72, 0.62))
    for reg in ("head", "torso", "hips", "upperarm", "forearm", "hand", "thigh", "shin", "foot"):
        F = [f for f, r in zip(BF, freg) if r == reg]
        vids = sorted({i for f in F for i in f})
        m = {v: k for k, v in enumerate(vids)}
        ob = make_mesh(f"lz_body_{reg}", BV[vids], [[m[i] for i in f] for f in F], skin_mat, layer=f"body_{reg}")
        skin(ob, vids)

    # ---- eyes ---------------------------------------------------------------------------------
    eye_mat = mat("lz_eye", (0.95, 0.95, 0.95))
    EP, EF = [], []
    for s in "LR":
        c = joint[bones[f"eye.{s}"]["head"]]
        n0 = len(EP)
        rings, segs = 8, 14
        for i in range(rings + 1):
            th = math.pi * i / rings
            for k in range(segs):
                ph = 2 * math.pi * k / segs
                EP.append(c + 0.0118 * np.array([math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)]))
        for i in range(rings):
            for k in range(segs):
                a0, a1 = n0 + i * segs + k, n0 + i * segs + (k + 1) % segs
                EF.append([a0, a1, a1 + segs, a0 + segs])
    eo = make_mesh("lz_eyes", np.array(EP), EF, eye_mat, layer="body_head")
    eo.vertex_groups.new(name="head").add(list(range(len(EP))), 1.0, "REPLACE")

    # ---- clothing layers --------------------------------------------------------------------------
    adj = [set() for _ in BV]
    for f in BF:
        for a in f:
            adj[a].update(f)
    def grow(F, thick, smooth=3, extra=None):
        """Duplicate faces F, push them out along the body normals by thick(v) and relax them
        a little so the cloth bridges small anatomical detail."""
        vids = sorted({i for f in F for i in f})
        m = {v: k for k, v in enumerate(vids)}
        P = np.array([BV[v] + N[v] * thick(v) for v in vids])
        ecount = {}
        for f in F:
            for a, b in zip(f, f[1:] + f[:1]):
                e = (min(a, b), max(a, b))
                ecount[e] = ecount.get(e, 0) + 1
        rim = {m[a] for (a, b), c in ecount.items() if c == 1} | {m[b] for (a, b), c in ecount.items() if c == 1}
        for _ in range(smooth):
            Q = P.copy()
            for k, v in enumerate(vids):
                nb = [m[u] for u in adj[v] if u in m and u != v]
                if nb and k not in rim:
                    Q[k] = P[k] * 0.5 + P[nb].mean(axis=0) * 0.5
            # keep the shell outside the body after relaxing
            for k, v in enumerate(vids):
                d = np.dot(Q[k] - BV[v], N[v])
                if d < thick(v) * 0.7:
                    Q[k] += N[v] * (thick(v) * 0.7 - d)
            P = Q
        if extra:
            P = extra(P, vids)
        return P, [[m[i] for i in f] for f in F], vids

    def zc(f):
        return float(np.mean(BV[f][:, 2]))

    def folds(P, vids, amp, freq=38.0, axis=2):
        """Soft horizontal drape folds (sleeve and trouser wrinkles)."""
        for k, v in enumerate(vids):
            P[k] += N[v] * amp * math.sin(BV[v][axis] * freq + 1.7 * math.sin(BV[v][0] * 13)) ** 2
        return P

    def garment(name, regs, thick, material, layer, zmin=-1.0, zmax=9.0, smooth=3, extra=None, filt=None):
        F = [f for f, r in zip(BF, freg) if r in regs and zmin <= zc(f) <= zmax and (filt is None or filt(f))]
        P, FF, vids = grow(F, thick, smooth, extra)
        ob = make_mesh(name, P, FF, material, layer=layer)
        skin(ob, vids)
        return ob

    chest_top = neck_z - 0.03
    def vneck(f):
        x, y, z = (float(t) for t in np.mean(BV[f], axis=0))
        if y > 0 or z > chest_top or z < belt_z + 0.06:
            return False
        return abs(x) < 0.012 + 0.11 * (z - (belt_z + 0.06)) / (chest_top - belt_z - 0.06)

    upper = ("torso", "hips", "upperarm", "forearm")
    legs = ("hips", "thigh", "shin")
    # suit (work)
    garment("lz_suit_shirt", upper, lambda v: 0.006, mat("lz_shirt", (0.95, 0.95, 0.94)), "suit", zmin=belt_z - 0.2,
            extra=lambda P, vids: folds(P, vids, 0.002))
    garment("lz_suit_collar", ("head",), lambda v: 0.008, mat("lz_shirt", (0.95, 0.95, 0.94)), "suit",
            zmax=neck_z + 0.045, zmin=neck_z - 0.1)
    garment("lz_suit_jacket", ("torso", "hips", "upperarm", "forearm"),
            lambda v: 0.02 + (0.012 if BV[v][2] < belt_z else 0.0), mat("lz_suit", (0.08, 0.09, 0.11)), "suit",
            zmin=crotch_z + 0.03, smooth=8,
            filt=lambda f: not (freg_is(f, "forearm") and zc(f) < j["wrist.L"][2] + 0.06) and not vneck(f),
            extra=lambda P, vids: folds(P, vids, 0.003, 30))
    garment("lz_suit_trousers", legs, lambda v: 0.012 + 0.012 * max(0.0, (j["lowerleg01.L"][2] - BV[v][2]) / 0.4),
            mat("lz_suit", (0.08, 0.09, 0.11)), "suit", zmin=ankle_z - 0.01, zmax=belt_z + 0.08, smooth=4,
            extra=lambda P, vids: folds(P, vids, 0.003, 26))
    garment("lz_suit_tie", ("torso", "hips"), lambda v: 0.011, mat("lz_tie", (0.12, 0.13, 0.2)), "suit",
            zmin=belt_z + 0.04, zmax=neck_z - 0.015, smooth=1,
            filt=lambda f: abs(float(np.mean(BV[f][:, 0]))) < 0.022 + 0.012 * (neck_z - zc(f)) / 0.5
            and float(np.mean(BV[f][:, 1])) < 0)
    garment("lz_shoes_dress", ("foot",), lambda v: 0.014, mat("lz_shoe", (0.03, 0.025, 0.02)), "suit")
    # pajamas (the Quin's set): long sleeves, long trousers, loose
    garment("lz_pj_top", upper, lambda v: 0.02, mat("lz_pj", (0.22, 0.23, 0.26)), "pajamas", zmin=belt_z - 0.15,
            smooth=5, extra=lambda P, vids: folds(P, vids, 0.004, 24))
    garment("lz_pj_collar", ("head",), lambda v: 0.012, mat("lz_pj", (0.22, 0.23, 0.26)), "pajamas",
            zmax=neck_z + 0.02, zmin=neck_z - 0.1)
    garment("lz_pj_trousers", legs, lambda v: 0.024, mat("lz_pj", (0.22, 0.23, 0.26)), "pajamas",
            zmin=ankle_z, zmax=belt_z + 0.06, smooth=5, extra=lambda P, vids: folds(P, vids, 0.005, 22))
    # lounge (home): sweatshirt + joggers + slippers
    garment("lz_lounge_top", upper, lambda v: 0.026, mat("lz_lounge", (0.55, 0.55, 0.56)), "lounge",
            zmin=belt_z - 0.18, smooth=6, extra=lambda P, vids: folds(P, vids, 0.005, 20))
    garment("lz_lounge_joggers", legs, lambda v: 0.022 - 0.012 * max(0.0, (ankle_z + 0.08 - BV[v][2]) / 0.08),
            mat("lz_lounge", (0.55, 0.55, 0.56)), "lounge", zmin=ankle_z, zmax=belt_z + 0.06, smooth=5,
            extra=lambda P, vids: folds(P, vids, 0.005, 22))
    garment("lz_slippers", ("foot",), lambda v: 0.012, mat("lz_slipper", (0.85, 0.82, 0.78)), "lounge|pajamas")
    # casual (weekends out): oversized tee, open overshirt, wide trousers, sneakers
    garment("lz_casual_tee", ("torso", "hips", "upperarm"), lambda v: 0.014, mat("lz_casual", (0.95, 0.95, 0.93)),
            "casual", zmin=belt_z - 0.14, smooth=5,
            filt=lambda f: not (freg_is(f, "upperarm") and zc(f) < j["lowerarm01.L"][2] + 0.12))
    garment("lz_casual_overshirt", upper, lambda v: 0.026, mat("lz_casual_shirt", (0.42, 0.5, 0.6)), "casual",
            zmin=belt_z - 0.2, smooth=6, filt=lambda f: not (freg_is(f, "torso") and abs(float(np.mean(BV[f][:, 0]))) < 0.07
                                                               and float(np.mean(BV[f][:, 1])) < 0),
            extra=lambda P, vids: folds(P, vids, 0.005, 20))
    garment("lz_casual_trousers", legs, lambda v: 0.016 + 0.03 * max(0.0, (crotch_z - BV[v][2]) / 0.7),
            mat("lz_casual_pants", (0.25, 0.24, 0.22)), "casual", zmin=ankle_z, zmax=belt_z + 0.06, smooth=6,
            extra=lambda P, vids: folds(P, vids, 0.006, 18))
    garment("lz_sneakers", ("foot",), lambda v: 0.018, mat("lz_sneaker", (0.95, 0.95, 0.95)), "casual")

    # ---- hair: short, dark, layered, fringe swept to his left -----------------------------------
    # A shell around the skull sampled on an azimuth / elevation grid: the scalp distance in
    # each direction comes from the head vertices, the hair sits a few cm outside it, and
    # the lower edge breaks into tapering locks.
    c = (joint[bones["eye.L"]["head"]] + joint[bones["eye.R"]["head"]]) / 2 + np.array([0, 0.05, 0.02])
    hv = BV[[i for i, r in enumerate(vreg) if r == "head" and BV[i][2] > c[2] - 0.12]]
    dirs = hv - c
    rad = np.linalg.norm(dirs, axis=1)
    dirs /= rad[:, None]
    def scalp_r(d):
        cos = dirs @ d
        sel = cos > math.cos(math.radians(7))
        return float(np.percentile(rad[sel], 55)) if sel.any() else float(rad.mean())
    NA, NE = 96, 30
    def edge(az):
        """Lowest elevation (deg) of the hair at azimuth az (0 = his face, +90 = his left)."""
        f = math.cos(az)                         # 1 front, -1 back
        sd = abs(math.sin(az))
        front = 20 - 13 * math.sin(az)           # diagonal fringe: forehead open on his right, swept down to his left
        base = front * max(0.0, f) ** 2 + 9 * sd * (1 - max(0.0, f)) - 36 * max(0.0, -f) ** 1.5
        locks = (1.5 if f > 0.5 else 3.0) * math.sin(az * 11) + 1.5 * math.sin(az * 23 + 1.0)
        return base - abs(locks)
    HP, HFc = [], []
    for ia in range(NA):
        az = 2 * math.pi * ia / NA
        e0 = edge(az)
        for ie in range(NE + 1):
            t = ie / NE
            el = math.radians(e0 + (88 - e0) * (1 - (1 - t) ** 1.6))
            # face direction is -y: az 0 -> -y, +90deg -> +x (his left)
            d = np.array([math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)])
            r = scalp_r(d)
            top = max(0.0, math.sin(el))
            th = (0.003 + 0.032 * top ** 1.5 + 0.008 * max(0.0, -math.cos(az)) * (1 - top)) * min(1.0, 0.25 + t * 4)
            p_ = c + d * (r + th)
            if math.cos(az) > 0.3 and el < math.radians(30):    # sweep the fringe sideways
                p_ += np.array([0.022, -0.004, 0.0]) * (math.cos(az) - 0.3) * (1 - el / math.radians(30))
            HP.append(p_)
    for ia in range(NA):
        for ie in range(NE):
            a0 = ia * (NE + 1) + ie
            a1 = ((ia + 1) % NA) * (NE + 1) + ie
            HFc.append([a0, a1, a1 + 1, a0 + 1])
    # cap the crown
    crown = len(HP)
    HP.append(c + np.array([0, 0, 1.0]) * (scalp_r(np.array([0, 0, 1.0])) + 0.034))
    for ia in range(NA):
        a0 = ia * (NE + 1) + NE
        a1 = ((ia + 1) % NA) * (NE + 1) + NE
        HFc.append([a0, a1, crown])
    ho = make_mesh("lz_hair", np.array(HP), HFc, mat("lz_hair", (0.03, 0.025, 0.025)), layer="hair")
    g = ho.vertex_groups.new(name="head")
    g.add(list(range(len(HP))), 1.0, "REPLACE")

    # export
    for o in bpy.context.scene.objects:
        o.select_set(o.name in coll.all_objects)
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children["Character"]
    path = os.path.join(out_dir, "lizeyan.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_active_collection=True, export_extras=True,
                              export_yup=True, export_apply=False, export_skins=True, export_animations=False,
                              export_materials="EXPORT", export_lights=False, export_cameras=False,
                              export_texcoords=False, export_normals=True)
    print(f"[lz] exported {path} ({os.path.getsize(path) / 1e6:.1f} MB), bones {len(arm_data.bones)}")
    return arm


def freg_is(f, r):
    return _FREG.get(tuple(f)) == r


_FREG: dict = {}


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "..", "web", "public", "assets"))
    ap.add_argument("--blend", default="")
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    build(os.path.abspath(a.out))
    if a.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.blend))
