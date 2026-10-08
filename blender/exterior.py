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

from lib import box, collection, cylinder, material, sphere
import lib

WATER_Z = -110.0


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

    # Near neighbours framing the view
    near = material("near_tower", albedo="facade_day", rough=0.3, metal=0.1, tile=(35.2, 108.8),
                    emission=(1, 1, 1), night_emission=1.0)
    _tower("near_west", -240, 210, 40, 34, 200, near, coll, crown=8)
    _tower("near_east", 330, 380, 46, 40, 150, near, coll, crown=10)
    _tower("near_east_2", 420, 210, 34, 34, 110, near, coll, crown=6)

    # Promenade and shore under the windows (our side)
    shore = material("shore", color=(0.42, 0.4, 0.37), rough=0.9)
    box("shore_ours", (900, 60, 6), (0, -10, WATER_Z + 1.5), shore, group=None, coll=coll)
    grass = material("park", color=(0.18, 0.28, 0.14), rough=1.0)
    box("park_ours", (300, 30, 6.2), (40, -30, WATER_Z + 1.6), grass, group=None, coll=coll)
    for i in range(40):
        sphere(f"tree_{i}", 3.2, (-150 + i * 8 + rnd.uniform(-2, 2), 12 + rnd.uniform(-2, 2), WATER_Z + 7.5),
               grass, scale=(1, 1, 1.2), segs=8, group=None, coll=coll)
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
