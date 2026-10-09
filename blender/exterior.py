"""Harbour-city world outside the glazing (exported separately, lit in three.js).

The apartment sits ~110 m above the water. Across the harbour (+Y) a dense
waterfront skyline rises against layered mountain ridges; two near towers
frame the view and give strong parallax while walking along the glass.
"""
from __future__ import annotations

import math
import random

import bmesh
import bpy
from mathutils import Vector, noise

import bpy

from lib import box, collection, cylinder, material, sphere
import lib

WATER_Z = -110.0
LANES: list = []   # traffic lanes for three.js (Blender coordinates)


def _tower(name, x, y, w, d, h, mat, coll, crown=None, rnd=None):
    """Tower with optional setback tiers so silhouettes read like a real skyline."""
    tiers = [(w, d, h)]
    if rnd is not None and h > 90 and rnd.random() < 0.6:
        f = rnd.uniform(0.55, 0.75)
        tiers = [(w, d, h * f), (w * 0.78, d * 0.78, h * (1 - f) * rnd.uniform(0.9, 1.3))]
        if rnd.random() < 0.35:
            tiers.append((w * 0.5, d * 0.5, h * rnd.uniform(0.06, 0.14)))
    z = WATER_Z
    first = None
    for i, (tw, td, th) in enumerate(tiers):
        ob = box(f"{name}_t{i}", (tw, td, th), (x, y, z + th / 2), mat, group=None, coll=coll)
        # facade texture tile: 16 windows x 32 floors => 2.2 m x 3.4 m per window
        ob["facade"] = 1
        lib.box_project_uv(ob, tile=(16 * 2.2, 32 * 3.4))
        z += th
        first = first or ob
        last = (tw, td)
    if crown:
        c = box(name + "_crown", (last[0] * 0.7, last[1] * 0.7, crown), (x, y, z + crown / 2),
                material("roof", color=(0.35, 0.36, 0.38), rough=0.7), group=None, coll=coll)
        c["roof"] = 1
    return first


def build():
    LANES.clear()
    coll = collection("Exterior")
    facade = material("facade_tower", albedo="facade_day", rough=0.35, tile=(35.2, 108.8),
                      emission=(1, 1, 1), night_emission=1.0)
    facade_b = material("facade_tower_b", color=(0.8, 0.82, 0.86), albedo="facade_day", rough=0.25, metal=0.2,
                        tile=(35.2, 108.8), emission=(1, 1, 1), night_emission=1.0)
    facade_c = material("facade_tower_c", color=(0.95, 0.86, 0.74), albedo="facade_day", rough=0.5,
                        tile=(35.2, 108.8), emission=(1, 1, 1), night_emission=1.0)
    facade_d = material("facade_tower_d", color=(0.45, 0.5, 0.55), albedo="facade_day", rough=0.15, metal=0.3,
                        tile=(35.2, 108.8), emission=(1, 1, 1), night_emission=1.0)
    mats = [facade, facade_b, facade_c, facade_d]
    rnd = random.Random(2027)

    # Opposite waterfront skyline ------------------------------------------------
    skyline = []
    x = -4200.0
    while x < 4200:
        w = rnd.uniform(28, 70)
        d = rnd.uniform(28, 60)
        dist = 1300 + rnd.uniform(0, 650)
        centre = math.exp(-((x + 300) / 1600) ** 2)
        h = rnd.uniform(40, 120) + centre * rnd.uniform(60, 260)
        skyline.append((x, dist, w, d, h))
        if rnd.random() < 0.55:  # second row behind
            skyline.append((x + rnd.uniform(-20, 20), dist + rnd.uniform(90, 260), w * 0.9, d,
                            h * rnd.uniform(0.8, 1.5)))
        x += w + rnd.uniform(6, 30)
    for i, (x, y, w, d, h) in enumerate(skyline):
        _tower(f"sky_{i}", x, y, w, d, h, mats[rnd.randrange(4)], coll,
               crown=rnd.uniform(4, 14) if rnd.random() < 0.5 else None, rnd=rnd)
    # Landmark towers
    _tower("landmark_a", -620, 1500, 80, 80, 484, facade_b, coll, crown=30)
    spire = cylinder("landmark_a_spire", 1.5, 60, (-620, 1500, WATER_Z + 484 + 60), material(
        "spire", color=(0.8, 0.8, 0.82), metal=1, rough=0.3), group=None, coll=coll)
    _tower("landmark_b", 420, 1650, 60, 60, 346, facade, coll, crown=24)

    # Our side of the harbour: street level, waterfront highway, promenade, city blocks --------
    GZ = WATER_Z + 2.5                      # street level, 2.5 m above the water
    near = material("near_tower", albedo="facade_day", rough=0.3, metal=0.1, tile=(35.2, 108.8),
                    emission=(1, 1, 1), night_emission=1.0)
    ground = material("ground_city", color=(0.3, 0.3, 0.29), rough=0.95)
    box("ground_ours", (9000, 2600, 4), (0, -1252, GZ - 2), ground, group=None, coll=coll)
    road = material("road_highway", albedo="road_albedo", rough=0.85, tile=(12, 24))
    r = box("highway", (9000, 24, 0.4), (0, 36, GZ + 0.2), road, group=None, coll=coll)
    lib.box_project_uv(r, tile=(12, 24))
    r["roadway"] = 1
    barrier = material("road_barrier", color=(0.7, 0.7, 0.68), rough=0.8)
    box("highway_median", (9000, 0.6, 1.0), (0, 36, GZ + 0.9), barrier, group=None, coll=coll)
    box("highway_kerb_s", (9000, 0.4, 0.5), (0, 23.8, GZ + 0.45), barrier, group=None, coll=coll)
    paving = material("promenade", color=(0.55, 0.52, 0.48), albedo="terrazzo_albedo", rough=0.9, tile=(6, 6))
    box("promenade", (9000, 20, 3), (0, 58, GZ - 1.3), paving, group=None, coll=coll)
    box("sea_wall", (9000, 1.0, 1.4), (0, 68, GZ + 0.5), barrier, group=None, coll=coll)
    grass = material("park", color=(0.18, 0.28, 0.14), rough=1.0)
    trunk = material("tree_trunk", color=(0.25, 0.18, 0.12), rough=0.9)
    lampm = material("street_lamp", color=(0.9, 0.85, 0.7), rough=0.4, emission=(1.0, 0.78, 0.45), night_emission=4.0)
    pole = material("lamp_pole", color=(0.2, 0.2, 0.22), metal=0.8, rough=0.4)
    tr, crowns, poles, heads = [], [], [], []
    for i in range(-110, 111):
        x = i * 18.0 + rnd.uniform(-2, 2)
        if i % 2 == 0:
            tr.append(((0.5, 0.5, 4.0), (x, 55 + rnd.uniform(-1, 1), GZ + 2.0)))
            crowns.append(((5.5, 5.5, 4.5), (x, 55, GZ + 5.5)))
        poles.append(((0.3, 0.3, 10.0), (x + 9, 36, GZ + 5.5)))
        heads.append(((2.6, 0.5, 0.35), (x + 9, 36, GZ + 10.4)))
        if i % 3 == 0:
            poles.append(((0.2, 0.2, 5.0), (x, 63, GZ + 2.5)))
            heads.append(((0.5, 0.5, 0.5), (x, 63, GZ + 5.2)))
    lib.multi_box("promenade_trunks", tr, trunk, group=None)
    lib.multi_box("promenade_crowns", crowns, grass, bevel=1.8, segs=2, group=None)
    lib.multi_box("lamp_poles", poles, pole, group=None)
    lib.multi_box("lamp_heads", heads, lampm, group=None)
    for ob in list(bpy.data.objects):
        if ob.name in ("promenade_trunks", "promenade_crowns", "lamp_poles", "lamp_heads"):
            for c in ob.users_collection:
                c.objects.unlink(ob)
            coll.objects.link(ob)
    # lanes for animated traffic (left-hand traffic: eastbound on the north carriageway)
    for k, y in enumerate((25.8, 29.3, 32.8)):
        LANES.append({"y": y, "z": GZ + 0.45, "dir": -1, "count": 24, "speed": 16 + 3 * k})
    for k, y in enumerate((39.2, 42.7, 46.2)):
        LANES.append({"y": y, "z": GZ + 0.45, "dir": 1, "count": 24, "speed": 22 - 3 * k})
    LANES.append({"y": 1236, "z": WATER_Z + 4.6, "dir": 1, "count": 40, "speed": 18, "far": 1})
    LANES.append({"y": 1244, "z": WATER_Z + 4.6, "dir": -1, "count": 40, "speed": 18, "far": 1})

    # City blocks on our side, set back south of the highway so the harbour stays open.
    mats = [facade, facade_b, facade_c, facade_d, near]
    podium = material("podium", color=(0.5, 0.48, 0.45), albedo="plaster_albedo", rough=0.8, tile=(8, 8))
    k = 0
    for gx in range(-30, 31):
        x0 = gx * 70.0
        if -1 <= gx <= 0:      # our own tower and its podium
            continue
        for gy, y0 in enumerate((-15.0, -110.0, -210.0, -330.0, -470.0)):
            if rnd.random() < 0.18:
                continue
            w, d = rnd.uniform(28, 46), rnd.uniform(26, 40)
            x = x0 + rnd.uniform(-8, 8)
            y = y0 - d / 2 - rnd.uniform(0, 12)
            centre = math.exp(-((x) / 900) ** 2)
            h = rnd.uniform(60, 130) + centre * rnd.uniform(20, 120) + gy * rnd.uniform(10, 40)
            if abs(x) < 120 and gy == 0:
                h = min(h, 95.0)  # immediate neighbours sit a little below our floor
            box(f"pod_{k}", (w + 8, d + 8, 14), (x, y, GZ + 7), podium, group=None, coll=coll)
            _tower(f"ours_{k}", x, y, w, d, h, mats[rnd.randrange(len(mats))], coll,
                   crown=rnd.uniform(4, 10) if rnd.random() < 0.6 else None, rnd=rnd)
            k += 1
    # our own tower's podium (seen when looking down past the glass)
    box("our_podium", (60, 50, 22), (-2, -5, GZ + 11), podium, group=None, coll=coll)

    shore = material("shore", color=(0.42, 0.4, 0.37), rough=0.9)
    # Opposite shore band
    box("shore_far", (9000, 120, 6), (0, 1250, WATER_Z + 1.5), shore, group=None, coll=coll)
    # Breakwater / ferry pier silhouettes
    box("pier_a", (12, 140, 4), (-300, 1150, WATER_Z + 1), shore, group=None, coll=coll)
    box("pier_b", (12, 120, 4), (380, 1160, WATER_Z + 1), shore, group=None, coll=coll)

    # Mountain ridges ---------------------------------------------------------------
    hill = material("hills", color=(0.16, 0.22, 0.17), rough=1.0)
    hill_far = material("hills_far", color=(0.28, 0.34, 0.38), rough=1.0)
    for name, y0, depth, amp, base, mat, seed in (("ridge_near", 2300, 1400, 520, 60, hill, 1),
                                                   ("ridge_far", 4200, 1800, 820, 120, hill_far, 7)):
        bm = bmesh.new()
        nx, ny = 160, 24
        W = 14000
        grid = []
        for j in range(ny + 1):
            row = []
            for i in range(nx + 1):
                x = -W / 2 + W * i / nx
                y = y0 + depth * j / ny
                t = j / ny
                prof = math.sin(t * math.pi) ** 0.8
                n = noise.fractal(Vector((x / 2200 + seed, y / 2200, seed)), 0.6, 2.2, 5)
                z = WATER_Z + base + amp * prof * (0.55 + 0.6 * n) * (0.6 + 0.4 * math.cos(x / 5200))
                row.append(bm.verts.new((x, y, max(WATER_Z + 2, z))))
            grid.append(row)
        for j in range(ny):
            for i in range(nx):
                bm.faces.new([grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]])
        lib._finish(name, bm, mat, group=None, coll=coll, angle=180)

    # Navigation lights / boats get created in three.js (animated)
    for ob in coll.objects:
        ob["exterior"] = 1
    return coll
