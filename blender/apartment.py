"""DearV harbour apartment — architecture, furniture, lights and interactables.

Blender space: X east, Y north (towards the harbour glazing), Z up, metres.
Footprint x[-7, 7] y[-5, 5], ceiling 3.0 m.

  y=5  ────────────── full-height harbour glazing ──────────────
       │  BEDROOM          │  DINING      LIVING (L sofa → TV) │
       │  x[-7,-1.2]       │                                    │
  y=0.8├──────────────door─┤                                    │
       │  STUDY / MEMORY   arch  KITCHEN ISLAND                 │
       │  gallery + letters│     kitchen run           ENTRY  │
  y=-5 ───────────────────────────────────────────────────door──
"""
from __future__ import annotations

import math
import random

import bpy
from mathutils import Vector

from lib import (add_collider, add_collider_from, box, collection, collider_for_group, cushion,
                 cylinder, ellipse, empty, extrude_poly, material, multi_box, rounded_rect,
                 sphere, tube)
import lib

H = 3.0          # ceiling height
XW = -9.0        # west exterior wall (bedroom + study wing)
PY = -0.6        # bedroom / study partition
WT = 0.14        # interior wall thickness
EXT = 0.25       # exterior wall thickness
R = math.radians

INTERACT: list[dict] = []
LIGHTS_NIGHT: list = []
LIGHTS_DAY: list = []


def interact(obj, kind, label, **extra):
    obj["interact"] = kind
    obj["label"] = label
    for k, v in extra.items():
        obj[k] = v
    INTERACT.append({"name": obj.name, "kind": kind, "label": label, **extra})
    return obj


# ---------------------------------------------------------------------------
def make_materials():
    M = {}
    M["oak"] = material("oak_floor", albedo="oak_albedo", normal="oak_normal", rough_map="oak_rough",
                        tile=(0.88, 2.4), normal_strength=0.35)
    M["plaster"] = material("plaster_wall", color=(0.9, 0.88, 0.85), albedo="plaster_albedo",
                            normal="plaster_normal", rough=0.85, tile=(2.0, 2.0), normal_strength=0.25)
    M["ceiling"] = material("ceiling", color=(0.93, 0.92, 0.9), rough=0.9)
    M["terrazzo"] = material("terrazzo", albedo="terrazzo_albedo", rough=0.35, tile=(1.4, 1.4))
    M["marble"] = material("marble_white", albedo="marble_albedo", rough_map="marble_rough",
                           tile=(1.8, 1.8), coat=0.3)
    M["darkmarble"] = material("marble_nero", albedo="darkmarble_albedo", rough_map="darkmarble_rough",
                               tile=(1.6, 1.6), coat=0.3)
    M["walnut"] = material("walnut", albedo="walnut_albedo", normal="walnut_normal", rough=0.42,
                           tile=(1.2, 1.2), normal_strength=0.3)
    M["oakfurn"] = material("oak_furniture", albedo="oak_albedo", rough=0.5, tile=(1.6, 4.0))
    M["boucle"] = material("boucle", albedo="boucle_albedo", normal="boucle_normal", rough=0.95,
                           tile=(0.5, 0.5), normal_strength=0.8, sheen=0.4)
    M["linen"] = material("linen", albedo="linen_albedo", normal="linen_normal", rough=0.9,
                          tile=(0.6, 0.6), sheen=0.3)
    M["velvet"] = material("velvet_green", albedo="velvet_albedo", normal="velvet_normal", rough=0.8,
                           tile=(0.5, 0.5), sheen=1.0)
    M["duvet"] = material("duvet", albedo="duvet_albedo", normal="duvet_normal", rough=0.92,
                          tile=(0.7, 0.7), sheen=0.3)
    M["leather"] = material("leather_cognac", albedo="leather_albedo", normal="leather_normal",
                            rough=0.45, tile=(0.5, 0.5))
    M["rug"] = material("rug_wool", albedo="rug_albedo", normal="rug_normal", rough=1.0, tile=(1, 1))
    M["rug2"] = material("rug_wool_bed", color=(0.62, 0.6, 0.56), albedo=None, normal="rug_normal",
                         rough=1.0, tile=(0.8, 0.8))
    M["brass"] = material("brass", color=(0.83, 0.64, 0.36), metal=1.0, rough=0.28)
    M["blackmetal"] = material("black_metal", color=(0.025, 0.025, 0.025), metal=0.6, rough=0.42)
    M["bronze"] = material("bronze_frame", color=(0.16, 0.13, 0.1), metal=0.85, rough=0.38)
    M["chrome"] = material("chrome", color=(0.9, 0.9, 0.9), metal=1.0, rough=0.08)
    M["satin"] = material("satin_white", color=(0.92, 0.91, 0.88), rough=0.35)
    M["cabinet"] = material("cabinet_greige", color=(0.66, 0.62, 0.56), rough=0.55)
    M["glass"] = material("window_glass", color=(0.86, 0.92, 0.95), rough=0.02, alpha=0.12)
    M["rail_glass"] = material("rail_glass", color=(0.7, 0.82, 0.84), rough=0.05, alpha=0.25)
    M["tvscreen"] = material("tv_screen", color=(0.01, 0.01, 0.012), rough=0.08)
    M["tvbody"] = material("tv_body", color=(0.03, 0.03, 0.03), metal=0.5, rough=0.4)
    M["shade"] = material("lamp_shade", color=(0.95, 0.9, 0.82), rough=0.9,
                          emission=(1.0, 0.78, 0.5), night_emission=6.0)
    M["bulb"] = material("lamp_bulb", color=(1, 0.95, 0.85), rough=0.2,
                         emission=(1.0, 0.82, 0.58), night_emission=20.0)
    M["ledstrip"] = material("led_strip", color=(1, 0.95, 0.88), rough=0.5,
                             emission=(1.0, 0.82, 0.62), night_emission=14.0)
    M["downlight"] = material("downlight", color=(0.95, 0.95, 0.95), rough=0.3,
                              emission=(1.0, 0.86, 0.7), night_emission=18.0)
    M["sheer"] = material("sheer_curtain", albedo="linen_albedo", rough=0.95, alpha=0.6, tile=(0.6, 0.6))
    M["blackout"] = material("blackout_curtain", color=(0.55, 0.5, 0.45), albedo=None,
                             normal="velvet_normal", rough=0.85, tile=(0.5, 0.5), sheen=0.6)
    M["leaf"] = material("leaf", color=(0.12, 0.26, 0.09), rough=0.55, sheen=0.2)
    M["trunk"] = material("trunk", color=(0.25, 0.18, 0.12), rough=0.8)
    M["pot"] = material("stone_pot", color=(0.55, 0.52, 0.48), albedo="plaster_albedo", rough=0.8,
                        tile=(0.5, 0.5))
    M["ceramic"] = material("ceramic", color=(0.92, 0.9, 0.86), rough=0.25, coat=0.6)
    M["paper"] = material("paper", color=(0.95, 0.93, 0.88), rough=0.85)
    M["envelope"] = material("envelope", color=(0.93, 0.86, 0.76), rough=0.8)
    M["wax"] = material("wax_seal", color=(0.55, 0.06, 0.08), rough=0.35)
    M["gift"] = material("gift_paper", color=(0.82, 0.12, 0.2), rough=0.4, coat=0.6)
    M["ribbon"] = material("gift_ribbon", color=(0.95, 0.85, 0.6), metal=0.4, rough=0.3, sheen=0.5)
    M["mat"] = material("photo_mat", color=(0.95, 0.94, 0.92), rough=0.9)
    M["balcony"] = material("balcony_stone", albedo="terrazzo_albedo", rough=0.6, tile=(1.2, 1.2))
    M["facade"] = material("facade_concrete", color=(0.72, 0.7, 0.66), albedo="plaster_albedo",
                           rough=0.8, tile=(3, 3))
    M["vinyl"] = material("vinyl", color=(0.02, 0.02, 0.02), rough=0.25)
    M["label"] = material("vinyl_label", color=(0.75, 0.2, 0.18), rough=0.6)
    M["mattress"] = material("mattress", color=(0.93, 0.92, 0.9), albedo="linen_albedo", rough=0.9,
                             tile=(0.6, 0.6))
    for i, c in enumerate([(0.55, 0.16, 0.14), (0.15, 0.25, 0.4), (0.82, 0.76, 0.62),
                           (0.2, 0.32, 0.25), (0.12, 0.12, 0.12), (0.78, 0.55, 0.3)]):
        M[f"book{i}"] = material(f"book_{i}", color=c, rough=0.6)
    for i in range(8):
        M[f"photo{i}"] = material(f"photo_{i}", albedo=f"photo_{i}", rough=0.35)
    return M


# ---------------------------------------------------------------------------
def build_shell(M):
    A = "arch"
    # Floors (never overlapping, so no z-fighting)
    box("floor_oak_main", (16, 6.7, 0.1), (-1, 1.65, -0.05), M["oak"], group=A)
    box("floor_oak_study", (7.8, 3.3, 0.1), (-5.1, -3.35, -0.05), M["oak"], group=A)
    box("floor_oak_entry", (2.4, 3.3, 0.1), (5.8, -3.35, -0.05), M["oak"], group=A)
    box("floor_terrazzo_kitchen", (5.8, 3.3, 0.1), (1.7, -3.35, -0.05), M["terrazzo"], group=A)
    box("ceiling", (16.5, 10.5, 0.12), (-1, 0, H + 0.06), M["ceiling"], group=A)

    # Exterior walls
    def wall(name, x0, y0, x1, y1, z0=0.0, z1=H, mat=M["plaster"], collide=True):
        ob = box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mat, group=A)
        if collide and z0 < 1.0:
            add_collider(x0, y0, x1, y1)
        return ob

    wall("wall_west", XW - EXT, -5 - EXT, XW, 5)
    wall("wall_east", 7, -5 - EXT, 7 + EXT, 5)
    wall("wall_south_a", XW - EXT, -5 - EXT, 5.3, -5)
    wall("wall_south_b", 6.3, -5 - EXT, 7 + EXT, -5)
    wall("wall_south_lintel", 5.3, -5 - EXT, 6.3, -5, 2.4, H, collide=False)

    # Partition x = -1.2 with study arch (y -3.3..-2.0) and bedroom door (y -0.45..0.55)
    px0, px1 = -1.2 - WT / 2, -1.2 + WT / 2
    wall("part_a", px0, -5, px1, -3.3)
    wall("part_b", px0, -2.0, px1, -0.45)
    wall("part_c", px0, 0.55, px1, 4.92)
    wall("part_arch_lintel", px0, -3.3, px1, -2.0, 2.45, H, collide=False)
    wall("part_door_lintel", px0, -0.45, px1, 0.55, 2.25, H, collide=False)
    # Bedroom / study wall
    wall("part_bed_study", XW, PY - WT / 2, px0, PY + WT / 2)

    # Skirting
    sk = []
    def skirt(x0, y0, x1, y1):
        sk.append(((abs(x1 - x0) or 0.018, abs(y1 - y0) or 0.018, 0.09), ((x0 + x1) / 2, (y0 + y1) / 2, 0.045)))
    w0 = XW + 0.01
    skirt(w0, -4.99, 5.3, -4.99); skirt(6.3, -4.99, 6.99, -4.99)
    skirt(w0, -4.99, w0, 4.9); skirt(6.99, -4.99, 6.99, 4.9)
    skirt(px0 - 0.009, -4.99, px0 - 0.009, -3.3); skirt(px1 + 0.009, -4.99, px1 + 0.009, -3.3)
    skirt(px0 - 0.009, -2.0, px0 - 0.009, PY - WT / 2); skirt(px1 + 0.009, -2.0, px1 + 0.009, -0.45)
    skirt(px0 - 0.009, 0.55, px0 - 0.009, 4.9); skirt(px1 + 0.009, 0.55, px1 + 0.009, 4.9)
    skirt(w0, PY - WT / 2 - 0.009, px0, PY - WT / 2 - 0.009)
    skirt(w0, PY + WT / 2 + 0.009, px0, PY + WT / 2 + 0.009)
    multi_box("skirting", sk, M["satin"], group=A)

    # Ceiling shadow-gap reveal + linear light slots in living / dining
    slots = [((0.05, 4.2, 0.02), (x, 2.75, H - 0.005)) for x in (2.4, 5.0)]
    slots += [((5.2, 0.05, 0.02), (1.9, -3.85, H - 0.005))]
    multi_box("ceiling_led_slots", slots, M["ledstrip"], group=None)

    # Window head pelmet hiding the curtain track
    box("pelmet", (16, 0.36, 0.22), (-1, 4.62, H - 0.11), M["ceiling"], group=A)


def build_glazing(M):
    """North curtain wall: bronze mullions, head/sill, glass panes, balcony."""
    xs_bed = [XW + i * ((-1.2 - XW) / 5) for i in range(6)]
    xs_liv = [-1.2 + i * (8.2 / 6) for i in range(7)]
    mull = []
    for x in xs_bed + xs_liv[1:]:
        mull.append(((0.07, 0.14, 2.75), (x, 4.95, 2.75 / 2 + 0.02)))
    mull.append(((16, 0.14, 0.07), (-1, 4.95, 0.035)))          # sill
    mull.append(((16, 0.14, 0.08), (-1, 4.95, 2.75)))           # head
    mull.append(((16, 0.06, 0.03), (-1, 4.88, 0.95)))           # slim horizontal glazing bar
    multi_box("mullions", mull, M["bronze"], bevel=0.006, group="furn")
    add_collider(XW, 4.8, 7, 5.2)

    panes = []
    for xa, xb in list(zip(xs_bed[:-1], xs_bed[1:])) + list(zip(xs_liv[:-1], xs_liv[1:])):
        panes.append(((xb - xa - 0.07, 0.02, 2.66), ((xa + xb) / 2, 4.95, 1.38)))
    g = multi_box("window_glass", panes, M["glass"], group=None)
    g["glass"] = 1

    # Facade band above/below glazing (visible from balcony angles)
    box("facade_head", (16.5, 0.3, 0.38), (-1, 5.1, H + 0.0), M["facade"], group="arch")

    # Balcony in front of the living room
    box("balcony_slab", (8.6, 1.9, 0.24), (2.9, 6.0, -0.14), M["balcony"], group="arch")
    box("balcony_soffit", (8.6, 1.9, 0.3), (2.9, 6.0, H + 0.2), M["facade"], group="arch")
    box("balcony_fin_w", (0.25, 1.9, H + 0.35), (-1.35, 6.0, H / 2), M["facade"], group="arch")
    box("balcony_fin_e", (0.25, 1.9, H + 0.35), (7.1, 6.0, H / 2), M["facade"], group="arch")
    rg = box("balcony_rail_glass", (8.2, 0.02, 1.0), (2.9, 6.9, 0.55), M["rail_glass"], group=None)
    rg["glass"] = 1
    box("balcony_handrail", (8.2, 0.06, 0.05), (2.9, 6.9, 1.08), M["bronze"], bevel=0.01)
    box("balcony_rail_shoe", (8.2, 0.1, 0.08), (2.9, 6.9, 0.04), M["bronze"])
    # two loungers + a planter so the balcony reads as lived-in
    for i, x in enumerate((1.2, 2.6)):
        p = empty(f"lounger_{i}", (x, 6.1, 0))
        box(f"lounger_{i}_frame", (0.62, 1.5, 0.08), (x, 6.1, 0.28), M["walnut"], bevel=0.02, parent=p)
        cushion(f"lounger_{i}_pad", (0.58, 1.1, 0.08), (x, 5.95, 0.36), M["linen"], parent=p)
        cushion(f"lounger_{i}_back", (0.58, 0.5, 0.08), (x, 6.55, 0.5), M["linen"],
                rot=(R(-40), 0, 0), parent=p)
        for dx in (-0.25, 0.25):
            for dy in (-0.6, 0.6):
                box(f"lounger_{i}_leg_{dx}_{dy}", (0.04, 0.04, 0.24), (x + dx, 6.1 + dy, 0.12),
                    M["blackmetal"], parent=p)
    box("balcony_planter", (1.6, 0.4, 0.5), (5.4, 6.55, 0.25), M["pot"], bevel=0.02)
    for i in range(14):
        random.seed(i)
        sphere(f"balcony_shrub_{i}", 0.16, (4.7 + i * 0.1, 6.55 + random.uniform(-0.08, 0.08), 0.55 +
               random.uniform(0, 0.08)), M["leaf"], scale=(1, 1, 0.8), segs=10)


def build_curtains(M):
    """Pleated sheers: scale.x is animated at runtime (1 = closed, ~0.14 = stacked)."""
    def pleated(name, width, height, mat, x_anchor, direction, y):
        import bmesh
        bm = bmesh.new()
        cols = int(width / 0.025)
        rows = 12
        verts = []
        for j in range(rows + 1):
            row = []
            z = height * j / rows
            for i in range(cols + 1):
                u = i / cols
                x = u * width * direction
                amp = 0.045 * (0.85 + 0.15 * math.sin(j * 0.7))
                yy = math.sin(u * width / 0.16 * 2 * math.pi) * amp
                row.append(bm.verts.new((x, yy, z)))
            verts.append(row)
        for j in range(rows):
            for i in range(cols):
                f = [verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]]
                bm.faces.new(f if direction > 0 else f[::-1])
        ob = lib._finish(name, bm, mat, (x_anchor, y, 0.03), (0, 0, 0), None, None, angle=80)
        return ob

    curtains = []
    # Living room sheers: two leaves meeting in the middle
    for name, xa, d, w in (("curtain_living_w", -1.1, 1, 4.0), ("curtain_living_e", 6.9, -1, 4.0)):
        c = pleated(name, w, H - 0.32, M["sheer"], xa, d, 4.78)
        c["open_scale"] = 0.13
        curtains.append(c)
    for name, xa, d, w in (("curtain_bed_w", XW + 0.1, 1, 3.8), ("curtain_bed_e", -1.35, -1, 3.8)):
        c = pleated(name, w, H - 0.32, M["blackout"], xa, d, 4.78)
        c["open_scale"] = 0.12
        curtains.append(c)
    for c in curtains:
        c.scale.x = c["open_scale"]
        c["curtain"] = 1
    # Wall controls that toggle each pair
    sw1 = box("curtain_switch_living", (0.08, 0.012, 0.12), (6.99 - 0.006, 4.35, 1.15), M["satin"],
              rot=(0, 0, R(90)))
    interact(sw1, "curtains", "窗簾 · 客廳", target="curtain_living")
    sw2 = box("curtain_switch_bed", (0.08, 0.012, 0.12), (-1.2 - WT / 2 - 0.006, 4.4, 1.15), M["satin"],
              rot=(0, 0, R(90)))
    interact(sw2, "curtains", "窗簾 · 臥室", target="curtain_bed")


# ---------------------------------------------------------------------------
def build_living(M):
    # Rug
    rug = extrude_poly("rug_living", rounded_rect(3.0, 3.4, 0.08), 0.014, (4.75, 2.85, 0.0), M["rug"])
    rug["uvfit"] = 1

    # L-shaped sofa: back to the dining room, facing the TV wall (+X)
    sofa = empty("sofa", (3.4, 2.8, 0))
    base = []
    base.append(((1.0, 3.1, 0.12), (3.45, 2.85, 0.1)))       # main plinth
    base.append(((1.0, 0.95, 0.12), (4.45, 1.8, 0.1)))       # chaise plinth
    multi_box("sofa_plinth", base, M["blackmetal"], bevel=0.01, parent=sofa)
    cushion("sofa_base_main", (1.02, 3.12, 0.26), (3.45, 2.85, 0.29), M["boucle"], puff=0.18, parent=sofa)
    cushion("sofa_base_chaise", (1.0, 0.96, 0.26), (4.46, 1.8, 0.29), M["boucle"], puff=0.18, parent=sofa)
    for i, y in enumerate((1.82, 2.86, 3.86)):
        cushion(f"sofa_seat_{i}", (0.86, 1.0, 0.16), (3.55, y, 0.5), M["boucle"], puff=0.4, parent=sofa)
    cushion("sofa_seat_chaise", (0.98, 0.94, 0.16), (4.52, 1.8, 0.5), M["boucle"], puff=0.4, parent=sofa)
    cushion("sofa_back_frame", (0.24, 3.12, 0.5), (3.07, 2.85, 0.62), M["boucle"], puff=0.35, parent=sofa)
    for i, y in enumerate((1.9, 2.88, 3.86)):
        cushion(f"sofa_back_{i}", (0.22, 0.98, 0.5), (3.24, y, 0.82), M["boucle"], puff=0.45,
                rot=(0, R(-12), 0), parent=sofa)
    cushion("sofa_arm", (1.02, 0.26, 0.42), (3.45, 4.32, 0.56), M["boucle"], puff=0.4, parent=sofa)
    # throw pillows
    cushion("pillow_0", (0.14, 0.5, 0.48), (3.42, 3.95, 0.8), M["velvet"], puff=0.48,
            rot=(R(6), R(-18), R(-6)), parent=sofa)
    cushion("pillow_1", (0.14, 0.46, 0.44), (3.42, 3.42, 0.78), M["linen"], puff=0.48,
            rot=(R(-5), R(-15), R(4)), parent=sofa)
    cushion("pillow_2", (0.14, 0.46, 0.44), (3.42, 1.62, 0.78), M["leather"], puff=0.48,
            rot=(0, R(-16), R(8)), parent=sofa)
    # draped throw blanket on the chaise
    cushion("throw", (0.5, 0.9, 0.05), (4.75, 1.84, 0.6), M["linen"], puff=0.45, rot=(0, 0, R(4)), parent=sofa)
    add_collider(2.9, 1.3, 3.98, 4.47)
    add_collider(3.98, 1.3, 4.97, 2.3)
    empty("sofa_seat_point", (3.6, 2.9, 1.15))
    # attach the clickable volume to the main seat cushion
    hit = bpy.data.objects["sofa_seat_1"]
    interact(hit, "sit", "坐下休息", seat="sofa_seat_point", look_at=[6.9, 2.85, 1.2])

    # Coffee tables: travertine-like marble round + small walnut nesting table
    ct = empty("coffee_table", (5.3, 3.05, 0))
    cylinder("coffee_top", 0.58, 0.05, (5.3, 3.05, 0.37), M["marble"], segs=64, bevel=0.012, parent=ct)
    cylinder("coffee_drum", 0.38, 0.34, (5.3, 3.05, 0.17), M["walnut"], segs=48, parent=ct)
    cylinder("coffee_top_2", 0.34, 0.035, (5.55, 2.15, 0.29), M["darkmarble"], segs=48, bevel=0.008)
    cylinder("coffee_stem_2", 0.04, 0.27, (5.55, 2.15, 0.135), M["brass"], segs=16)
    cylinder("coffee_foot_2", 0.18, 0.012, (5.55, 2.15, 0.006), M["brass"], segs=32)
    add_collider(4.72, 2.47, 5.88, 3.63)
    # styling: books, a vase with branches, candle
    box("ct_book_a", (0.3, 0.22, 0.035), (5.12, 3.18, 0.413), M["book2"], bevel=0.003, rot=(0, 0, R(12)))
    box("ct_book_b", (0.26, 0.2, 0.03), (5.13, 3.17, 0.446), M["book1"], bevel=0.003, rot=(0, 0, R(4)))
    cylinder("ct_vase", 0.075, 0.26, (5.48, 2.92, 0.525), M["ceramic"], r2=0.05, segs=32)
    for i in range(5):
        a = i * 1.3
        tube(f"ct_branch_{i}", [(5.48, 2.92, 0.6), (5.48 + 0.08 * math.cos(a), 2.92 + 0.08 * math.sin(a), 0.85),
                                 (5.48 + 0.22 * math.cos(a), 2.92 + 0.2 * math.sin(a), 1.05 + 0.05 * i)],
             0.006, M["trunk"])
    cylinder("ct_candle", 0.04, 0.09, (5.25, 2.8, 0.44), M["ceramic"], segs=24)

    # TV wall: walnut slats + floating console + 65" TV
    slats = [((0.02, 0.035, 2.98), (6.985, 1.35 + i * 0.06, 1.49)) for i in range(50)]
    multi_box("tv_slats", slats, M["walnut"], group="arch")
    box("tv_slat_back", (0.01, 3.05, 2.98), (6.996, 2.82, 1.49), M["blackmetal"], group="arch")
    box("tv_console", (0.42, 2.6, 0.32), (6.74, 2.85, 0.42), M["walnut"], bevel=0.008)
    box("tv_console_shadow", (0.36, 2.5, 0.02), (6.76, 2.85, 0.255), M["blackmetal"])
    add_collider(6.5, 1.5, 7.0, 4.2)
    box("tv_body", (0.045, 1.46, 0.84), (6.93, 2.85, 1.42), M["tvbody"], bevel=0.004)
    scr = box("tv_screen", (0.006, 1.43, 0.81), (6.905, 2.85, 1.42), M["tvscreen"])
    scr["uvfit"] = "-yz"
    interact(scr, "tv", "電視 · 回憶投影")
    # turntable on the console
    tt = empty("turntable", (6.72, 3.75, 0.58))
    box("turntable_plinth", (0.36, 0.44, 0.07), (6.72, 3.75, 0.615), M["walnut"], bevel=0.008, parent=tt)
    platter = cylinder("turntable_platter", 0.15, 0.015, (6.72, 3.73, 0.658), M["chrome"], segs=48)
    rec = cylinder("turntable_record", 0.148, 0.004, (6.72, 3.73, 0.668), M["vinyl"], segs=64)
    cylinder("turntable_label", 0.045, 0.001, (6.72, 3.73, 0.6705), M["label"], segs=32, parent=rec)
    rec.parent = platter
    rec.matrix_parent_inverse = platter.matrix_world.inverted()
    platter["spin"] = 1
    tube("turntable_arm", [(6.84, 3.93, 0.69), (6.84, 3.75, 0.69), (6.78, 3.66, 0.685)], 0.005, M["chrome"])
    interact(platter, "music", "黑膠唱機 · 播放音樂")
    # a pair of ceramic objects on console
    cylinder("console_vase", 0.07, 0.3, (6.72, 2.0, 0.73), M["ceramic"], r2=0.03, segs=32)
    sphere("console_orb", 0.09, (6.72, 2.25, 0.67), M["darkmarble"])

    # Arc floor lamp behind the sofa corner
    cylinder("arc_lamp_base", 0.2, 0.05, (2.75, 4.5, 0.025), M["darkmarble"], segs=48, bevel=0.01)
    pts = []
    for i in range(16):
        t = i / 15
        pts.append((2.75 + 1.1 * t, 4.5 - 0.85 * t, 0.05 + 2.05 * math.sin(t * math.pi * 0.62)))
    tube("arc_lamp_stem", pts, 0.012, M["brass"])
    shade = sphere("arc_lamp_shade", 0.2, (3.85, 3.65, 1.8), M["brass"], scale=(1, 1, 0.55))
    bulb = sphere("arc_lamp_bulb", 0.07, (3.85, 3.65, 1.74), M["bulb"])
    interact(shade, "lamp", "落地燈", light="arc_lamp")
    bulb["lamp_group"] = "arc_lamp"
    point_light("arc_lamp", (3.85, 3.65, 1.66), 60, (1.0, 0.75, 0.48), 0.1)

    # Lounge chair by the window facing the sofa
    ch = empty("lounge_chair", (5.6, 4.1, 0))
    cushion("lounge_seat", (0.78, 0.8, 0.2), (5.6, 4.05, 0.36), M["leather"], puff=0.35, parent=ch)
    cushion("lounge_back", (0.78, 0.18, 0.62), (5.6, 4.45, 0.68), M["leather"], puff=0.4,
            rot=(R(-12), 0, 0), parent=ch)
    for dx in (-0.36, 0.36):
        box(f"lounge_arm_{dx}", (0.06, 0.78, 0.06), (5.6 + dx, 4.1, 0.56), M["walnut"], bevel=0.02, parent=ch)
        box(f"lounge_leg_f_{dx}", (0.05, 0.05, 0.56), (5.6 + dx, 3.75, 0.28), M["walnut"], bevel=0.015,
            rot=(R(-6), 0, 0), parent=ch)
        box(f"lounge_leg_b_{dx}", (0.05, 0.05, 0.56), (5.6 + dx, 4.45, 0.28), M["walnut"], bevel=0.015,
            rot=(R(8), 0, 0), parent=ch)
    ch.rotation_euler.z = R(28)
    add_collider(5.1, 3.6, 6.1, 4.6)

    # Big fiddle-leaf plant in the corner
    plant("plant_living", (6.5, 4.25), M, 2.1)
    plant("plant_dining", (-0.75, 4.45), M, 1.6)


def plant(name, xy, M, height):
    x, y = xy
    cylinder(f"{name}_pot", 0.26, 0.5, (x, y, 0.25), M["pot"], r2=0.22, segs=40, bevel=0.01)
    cylinder(f"{name}_soil", 0.24, 0.01, (x, y, 0.49), M["trunk"], segs=24)
    rnd = random.Random(hash(name) & 0xffff)
    tube(f"{name}_trunk", [(x, y, 0.45), (x + 0.03, y - 0.02, height * 0.5), (x - 0.02, y + 0.03, height * 0.85)],
         0.025, M["trunk"])
    leaves = []
    import bmesh
    bm = bmesh.new()
    for i in range(46):
        z = 0.75 + (height - 0.75) * (i / 46) ** 0.8
        a = i * 2.4
        r = 0.08 + 0.32 * rnd.random()
        lx, ly = x + r * math.cos(a), y + r * math.sin(a)
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=10, v_segments=6, radius=1.0)
        bmesh.ops.scale(tmp, vec=(0.13, 0.09, 0.012), verts=tmp.verts)
        for v in tmp.verts:  # cup the leaf
            v.co.z += (v.co.x ** 2) * 2.0 + (v.co.y ** 2) * 1.5
        from mathutils import Matrix
        m = (Matrix.Translation((lx, ly, z)) @ Matrix.Rotation(a, 4, "Z") @
             Matrix.Rotation(R(-25 - 30 * rnd.random()), 4, "Y"))
        bmesh.ops.transform(tmp, matrix=m, verts=tmp.verts)
        me = bpy.data.meshes.new("_t")
        tmp.to_mesh(me)
        tmp.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    lib._finish(f"{name}_leaves", bm, M["leaf"], angle=80)
    add_collider(x - 0.3, y - 0.3, x + 0.3, y + 0.3)


def build_dining(M):
    dt = empty("dining_table", (0.7, 3.1, 0))
    extrude_poly("dining_top", rounded_rect(1.05, 2.1, 0.45), 0.045, (0.7, 3.1, 0.71), M["oakfurn"], bevel=0.01,
                 parent=dt)
    for dy in (-0.62, 0.62):
        box(f"dining_leg_{dy}", (0.5, 0.08, 0.7), (0.7, 3.1 + dy, 0.355), M["walnut"], bevel=0.02, parent=dt)
        box(f"dining_foot_{dy}", (0.7, 0.12, 0.03), (0.7, 3.1 + dy, 0.015), M["walnut"], bevel=0.01, parent=dt)
    box("dining_runner", (0.32, 1.4, 0.004), (0.7, 3.1, 0.757), M["linen"])
    for i, dy in enumerate((-0.35, 0.0, 0.35)):
        cylinder(f"dining_candle_{i}", 0.025, 0.18 + 0.05 * i, (0.7, 3.1 + dy, 0.85 + 0.025 * i), M["ceramic"],
                 segs=16)
    add_collider(0.15, 2.0, 1.25, 4.2)
    for side in (-1, 1):
        for j, y in enumerate((2.45, 3.1, 3.75)):
            chair(f"dining_chair_{side}_{j}", (0.7 + side * 0.72, y), R(90) if side < 0 else R(-90), M)
    # linear pendant
    pend = empty("dining_pendant", (0.7, 3.1, 2.15))
    box("dining_pendant_body", (0.09, 1.6, 0.05), (0.7, 3.1, 2.15), M["blackmetal"], bevel=0.01, parent=pend)
    box("dining_pendant_led", (0.06, 1.55, 0.004), (0.7, 3.1, 2.122), M["ledstrip"], parent=pend)
    for dy in (-0.7, 0.7):
        cylinder(f"dining_cable_{dy}", 0.002, H - 2.17, (0.7, 3.1 + dy, (H + 2.17) / 2), M["blackmetal"], segs=6)
    interact(bpy.data.objects["dining_pendant_body"], "lamp", "餐桌吊燈", light="dining_pendant")
    bpy.data.objects["dining_pendant_led"]["lamp_group"] = "dining_pendant"
    area_light("dining_pendant", (0.7, 3.1, 2.11), (0.05, 1.5), 90, (1.0, 0.8, 0.58))


def chair(name, xy, rot, M):
    x, y = xy
    c = empty(name, (x, y, 0))
    cushion(f"{name}_seat", (0.46, 0.46, 0.07), (x, y, 0.46), M["linen"], puff=0.4, parent=c)
    box(f"{name}_frame", (0.46, 0.46, 0.03), (x, y, 0.415), M["walnut"], bevel=0.008, parent=c)
    cushion(f"{name}_back", (0.44, 0.05, 0.36), (x, y + 0.23, 0.72), M["linen"], puff=0.35, rot=(R(-8), 0, 0),
            parent=c)
    for dx in (-0.2, 0.2):
        for dy in (-0.2, 0.2):
            box(f"{name}_leg_{dx}_{dy}", (0.035, 0.035, 0.42), (x + dx, y + dy, 0.21), M["walnut"], bevel=0.008,
                parent=c)
    c.rotation_euler.z = rot


def build_kitchen(M):
    # Tall column (fridge + ovens) on the west end
    box("k_tall", (1.2, 0.66, 2.62), (-0.55, -4.66, 1.31), M["cabinet"], bevel=0.004)
    fridge_door = empty("fridge_hinge", (-1.14, -4.32, 0))
    box("k_fridge_door", (0.58, 0.03, 2.3), (-0.85, -4.31, 1.2), M["cabinet"], bevel=0.004, parent=fridge_door)
    box("k_fridge_handle", (0.02, 0.03, 0.9), (-0.6, -4.28, 1.25), M["brass"], bevel=0.006, parent=fridge_door)
    interact(fridge_door, "door", "冰箱", angle=100)
    box("k_oven", (0.56, 0.03, 0.56), (-0.26, -4.31, 1.15), M["tvbody"], bevel=0.004)
    box("k_oven_glass", (0.48, 0.005, 0.3), (-0.26, -4.295, 1.13), M["tvscreen"])
    box("k_oven_handle", (0.44, 0.03, 0.02), (-0.26, -4.28, 1.38), M["brass"], bevel=0.006)
    add_collider(-1.2, -5.0, 0.05, -4.3)

    # Base run with counter, sink, cooktop
    box("k_base", (4.3, 0.6, 0.86), (2.25, -4.69, 0.47), M["cabinet"], bevel=0.003)
    box("k_toe", (4.3, 0.52, 0.1), (2.25, -4.73, 0.05), M["blackmetal"])
    fronts = []
    for i in range(7):
        x = 0.1 + 4.3 * (i + 0.5) / 7
        fronts.append(((0.008, 0.006, 0.82), (0.1 + 4.3 * (i + 1) / 7, -4.385, 0.5)))
    multi_box("k_front_gaps", fronts, M["blackmetal"])
    handles = [((0.3, 0.018, 0.012), (0.1 + 4.3 * (i + 0.5) / 7, -4.37, 0.84)) for i in range(7)]
    multi_box("k_handles", handles, M["brass"], bevel=0.004)
    box("k_counter", (4.34, 0.66, 0.04), (2.25, -4.68, 0.92), M["marble"], bevel=0.004)
    box("k_backsplash", (4.34, 0.02, 0.62), (2.25, -4.99, 1.25), M["marble"])
    add_collider(0.05, -5.0, 4.45, -4.32)
    # sink + faucet
    box("k_sink", (0.62, 0.42, 0.012), (1.0, -4.66, 0.935), M["blackmetal"])
    f = empty("faucet", (1.0, -4.9, 0.94))
    cylinder("k_faucet_base", 0.025, 0.05, (1.0, -4.9, 0.965), M["brass"], segs=16, parent=f)
    tube("k_faucet_neck", [(1.0, -4.9, 0.95), (1.0, -4.9, 1.3), (1.0, -4.84, 1.37), (1.0, -4.72, 1.34),
                           (1.0, -4.68, 1.24)], 0.013, M["brass"], parent=f)
    empty("k_faucet_spout", (1.0, -4.68, 1.22), parent=f)
    interact(bpy.data.objects["k_faucet_neck"], "faucet", "水龍頭", spout="k_faucet_spout")
    # cooktop + hood
    box("k_cooktop", (0.78, 0.5, 0.006), (2.5, -4.66, 0.943), M["tvscreen"])
    for i, (dx, dy, r) in enumerate(((-0.2, -0.1, 0.1), (0.2, -0.1, 0.08), (-0.2, 0.12, 0.07), (0.2, 0.12, 0.1))):
        cylinder(f"k_ring_{i}", r, 0.001, (2.5 + dx, -4.66 + dy, 0.947), M["bronze"], segs=32)
    box("k_hood", (0.9, 0.5, 0.42), (2.5, -4.75, 2.1), M["satin"], bevel=0.01)
    box("k_hood_chimney", (0.36, 0.3, 0.7), (2.5, -4.84, 2.65), M["satin"])
    # upper cabinets + open walnut shelf
    box("k_upper_w", (1.5, 0.36, 0.9), (0.85, -4.82, 2.05), M["cabinet"], bevel=0.003)
    box("k_upper_e", (1.4, 0.36, 0.9), (3.75, -4.82, 2.05), M["cabinet"], bevel=0.003)
    box("k_undercab_led_w", (1.4, 0.02, 0.01), (0.85, -4.7, 1.595), M["ledstrip"], group=None)
    box("k_undercab_led_e", (1.3, 0.02, 0.01), (3.75, -4.7, 1.595), M["ledstrip"], group=None)
    area_light("k_under_w", (0.85, -4.75, 1.58), (1.3, 0.05), 25, (1.0, 0.82, 0.6), night_only=True)
    area_light("k_under_e", (3.75, -4.75, 1.58), (1.2, 0.05), 25, (1.0, 0.82, 0.6), night_only=True)
    for i in range(5):
        cylinder(f"k_jar_{i}", 0.05, 0.16 + 0.03 * (i % 2), (3.25 + i * 0.15, -4.85, 1.02 + 0.015 * (i % 2)),
                 M["ceramic"], segs=24)

    # Island with waterfall marble and walnut base
    box("island_base", (2.7, 0.9, 0.86), (1.7, -2.75, 0.45), M["walnut"], bevel=0.006)
    box("island_top", (2.9, 1.04, 0.05), (1.7, -2.75, 0.905), M["marble"], bevel=0.004)
    for sx in (-1, 1):
        box(f"island_waterfall_{sx}", (0.05, 1.04, 0.88), (1.7 + sx * 1.425, -2.75, 0.44), M["marble"], bevel=0.004)
    add_collider(0.23, -3.3, 3.17, -2.2)
    sphere("island_bowl", 0.17, (1.1, -2.85, 0.98), M["ceramic"], scale=(1, 1, 0.45))
    for i in range(5):
        sphere(f"island_fruit_{i}", 0.045, (1.05 + 0.04 * math.cos(i * 1.3), -2.85 + 0.05 * math.sin(i * 1.3),
               1.02 + 0.02 * (i % 2)), material(f"fruit_{i % 2}", color=((0.85, 0.5, 0.1), (0.75, 0.1, 0.08))[i % 2],
                                                rough=0.4), segs=12)
    box("island_board", (0.45, 0.3, 0.025), (2.3, -2.7, 0.943), M["oakfurn"], bevel=0.008, rot=(0, 0, R(8)))
    for i, x in enumerate((0.6, 1.3, 2.1, 2.8)):
        stool(f"stool_{i}", (x, -1.95), M)
    for i, x in enumerate((1.05, 1.7, 2.35)):
        pendant_globe(f"island_pendant_{i}", (x, -2.75, 1.9), M)
    interact(bpy.data.objects["island_pendant_1_glass"], "lamp", "中島吊燈", light="island_pendants")


def stool(name, xy, M):
    x, y = xy
    s = empty(name, (x, y, 0))
    cylinder(f"{name}_seat", 0.2, 0.06, (x, y, 0.68), M["leather"], segs=32, bevel=0.02, parent=s)
    cylinder(f"{name}_post", 0.025, 0.65, (x, y, 0.33), M["brass"], segs=16, parent=s)
    cylinder(f"{name}_foot", 0.2, 0.015, (x, y, 0.008), M["brass"], segs=32, parent=s)
    tube(f"{name}_ring", [(x + 0.16 * math.cos(a * math.pi / 12), y + 0.16 * math.sin(a * math.pi / 12), 0.25)
                          for a in range(25)], 0.007, M["brass"], parent=s)
    add_collider(x - 0.22, y - 0.22, x + 0.22, y + 0.22)


def pendant_globe(name, loc, M):
    x, y, z = loc
    glass = material("globe_glass", color=(0.98, 0.95, 0.9), rough=0.25, emission=(1.0, 0.8, 0.55),
                     night_emission=5.0)
    cylinder(f"{name}_cable", 0.002, H - z - 0.15, (x, y, (H + z + 0.15) / 2), M["blackmetal"], segs=6)
    cylinder(f"{name}_cap", 0.04, 0.05, (x, y, z + 0.17), M["brass"], segs=24)
    g = sphere(f"{name}_glass", 0.15, (x, y, z), glass, segs=32)
    g["lamp_group"] = "island_pendants"
    point_light(f"{name}", (x, y, z), 22, (1.0, 0.78, 0.52), 0.12, group="island_pendants")


def build_entry(M):
    # Front door (decorative, opens onto the private lift lobby glow)
    d = empty("front_door_hinge", (5.32, -5.05, 0))
    box("front_door_leaf", (0.98, 0.06, 2.36), (5.81, -5.05, 1.18), M["walnut"], bevel=0.006, parent=d)
    box("front_door_pull", (0.03, 0.05, 1.1), (6.18, -4.99, 1.1), M["brass"], bevel=0.01, parent=d)
    box("front_door_lock", (0.07, 0.02, 0.16), (6.18, -5.0, 1.45), M["tvbody"], bevel=0.008, parent=d)
    interact(d, "door", "大門", angle=-80)
    add_collider(5.3, -5.4, 6.3, -5.0)
    frame = [((0.06, 0.32, 2.42), (5.27, -5.12, 1.21)), ((0.06, 0.32, 2.42), (6.33, -5.12, 1.21)),
             ((1.12, 0.32, 0.06), (5.8, -5.12, 2.43))]
    multi_box("front_door_frame", frame, M["satin"], bevel=0.004)
    # lobby glow behind the door
    box("lobby_floor", (2.4, 2.0, 0.1), (5.8, -6.3, -0.05), M["marble"], group=None)
    box("lobby_back", (2.4, 0.1, H), (5.8, -7.3, H / 2), material("lobby_wall", color=(0.85, 0.78, 0.68),
                                                                  emission=(1, 0.85, 0.65), emission_strength=0.6),
        group=None)
    for sx in (-1, 1):
        box(f"lobby_side_{sx}", (0.1, 2.0, H), (5.8 + sx * 1.15, -6.3, H / 2), M["satin"], group=None)
    box("lobby_ceiling", (2.4, 2.0, 0.1), (5.8, -6.3, H), M["satin"], group=None)
    # console + mirror + bench
    box("entry_console", (0.36, 1.6, 0.06), (6.8, -3.4, 0.86), M["walnut"], bevel=0.01)
    for dy in (-0.75, 0.75):
        box(f"entry_console_leg_{dy}", (0.3, 0.03, 0.86), (6.8, -3.4 + dy, 0.43), M["brass"])
    add_collider(6.6, -4.25, 7.0, -2.55)
    cylinder("entry_mirror", 0.55, 0.02, (6.985, -3.4, 1.75), M["chrome"], segs=64, rot=(0, R(90), 0))
    cylinder("entry_mirror_frame", 0.57, 0.015, (6.99, -3.4, 1.75), M["brass"], segs=64, rot=(0, R(90), 0))
    cylinder("entry_bowl", 0.12, 0.05, (6.8, -3.0, 0.915), M["ceramic"], r2=0.07, segs=32)
    box("entry_mat", (1.1, 0.7, 0.012), (5.8, -4.5, 0.006), M["rug2"])


def build_bedroom(M):
    """Master bedroom x[-9, -1.27] y[-0.53, 5]: bed, wardrobe, keepsake vitrine, letter wall."""
    bx, by = -7.85, 2.6   # bed centre (headboard against the west wall)
    rug = extrude_poly("rug_bed", rounded_rect(3.4, 3.6, 0.06), 0.014, (-7.0, by, 0.0), M["rug2"])
    rug["uvfit"] = 1
    bed = empty("bed", (bx, by, 0))
    box("bed_plinth", (2.1, 1.64, 0.1), (bx, by, 0.06), M["blackmetal"])
    cushion("bed_base", (2.18, 1.74, 0.3), (bx, by, 0.27), M["velvet"], puff=0.2, parent=bed)
    cushion("bed_headboard", (0.16, 2.1, 1.2), (bx - 1.03, by, 0.82), M["velvet"], puff=0.25, parent=bed)
    for i, dy in enumerate((-0.6, 0.0, 0.6)):
        cushion(f"bed_head_panel_{i}", (0.1, 0.56, 0.92), (bx - 0.93, by + dy, 1.0), M["velvet"], puff=0.45, parent=bed)
    cushion("bed_mattress", (2.0, 1.6, 0.24), (bx + 0.03, by, 0.52), M["mattress"], puff=0.2, parent=bed)
    cushion("bed_duvet", (1.55, 1.72, 0.14), (bx + 0.3, by, 0.66), M["duvet"], puff=0.45, parent=bed)
    cushion("bed_throw", (0.5, 1.78, 0.06), (bx + 0.9, by, 0.75), M["linen"], puff=0.45, parent=bed)
    for i, dy in enumerate((-0.4, 0.4)):
        cushion(f"bed_pillow_{i}", (0.22, 0.66, 0.42), (bx - 0.7, by + dy, 0.82), M["duvet"], puff=0.48,
                rot=(0, R(-22), 0), parent=bed)
        cushion(f"bed_pillow_front_{i}", (0.16, 0.54, 0.36), (bx - 0.53, by + dy, 0.8), M["linen"], puff=0.48,
                rot=(0, R(-18), 0), parent=bed)
    cushion("bed_pillow_bolster", (0.18, 0.7, 0.24), (bx - 0.35, by, 0.78), M["velvet"], puff=0.48, parent=bed)
    add_collider(XW, by - 0.95, bx + 1.1, by + 0.95)
    box("bed_art", (0.04, 2.0, 0.75), (XW + 0.02, by, 2.2), M["linen"], bevel=0.01)

    # Bench at the foot of the bed carrying the big ribboned gift
    gx = bx + 1.42
    cushion("bed_bench_pad", (0.44, 1.5, 0.12), (gx, by, 0.46), M["leather"], puff=0.4)
    for dy in (-0.66, 0.66):
        box(f"bed_bench_leg_{dy}", (0.42, 0.04, 0.4), (gx, by + dy, 0.2), M["brass"])
    add_collider(gx - 0.23, by - 0.76, gx + 0.23, by + 0.76)
    gy, gz = by + 0.35, 0.62
    box("gift_body", (0.3, 0.3, 0.2), (gx, gy, gz), M["gift"], bevel=0.004)
    multi_box("gift_ribbon_body", [((0.302, 0.04, 0.202), (gx, gy, gz)), ((0.04, 0.302, 0.202), (gx, gy, gz))],
              M["ribbon"])
    lid = empty("gift_lid", (gx, gy - 0.15, gz + 0.1))
    box("gift_lid_box", (0.32, 0.32, 0.05), (gx, gy, gz + 0.12), M["gift"], bevel=0.006, parent=lid)
    multi_box("gift_lid_ribbon", [((0.322, 0.04, 0.052), (gx, gy, gz + 0.12)), ((0.04, 0.322, 0.052), (gx, gy, gz + 0.12))],
              M["ribbon"], parent=lid)
    for i, a in enumerate((R(30), R(-30))):
        sphere(f"gift_bow_{i}", 0.06, (gx + 0.1 * math.sin(a), gy, gz + 0.18), M["ribbon"],
               scale=(1, 0.45, 0.6), rot=(0, a, 0), parent=lid)
    heart = sphere("gift_heart", 0.05, (gx, gy, gz + 0.07), material("heart", color=(0.9, 0.1, 0.18), rough=0.25,
                                                                        coat=1.0, emission=(1, 0.2, 0.3),
                                                                        emission_strength=0.0))
    heart["gift_heart"] = 1
    interact(lid, "gift", "禮物盒", angle=110)

    # Nightstands + lamps
    for i, y in enumerate((by - 1.32, by + 1.25)):
        nx = XW + 0.3
        box(f"nightstand_{i}", (0.5, 0.46, 0.5), (nx, y, 0.3), M["walnut"], bevel=0.01)
        box(f"nightstand_{i}_drawer_gap", (0.004, 0.4, 0.004), (nx + 0.252, y, 0.38), M["blackmetal"])
        box(f"nightstand_{i}_pull", (0.015, 0.12, 0.012), (nx + 0.26, y, 0.45), M["brass"])
        add_collider(XW, y - 0.24, nx + 0.27, y + 0.24)
        cylinder(f"bed_lamp_{i}_base", 0.07, 0.3, (nx - 0.02, y, 0.7), M["ceramic"], r2=0.05, segs=32)
        s = cylinder(f"bed_lamp_{i}_shade", 0.16, 0.2, (nx - 0.02, y, 0.95), M["shade"], r2=0.12, segs=40)
        interact(s, "lamp", "床頭燈", light=f"bed_lamp_{i}")
        s["lamp_group"] = f"bed_lamp_{i}"
        point_light(f"bed_lamp_{i}", (nx - 0.02, y, 0.92), 30, (1.0, 0.72, 0.45), 0.08)

    # Wardrobe against the bedroom/study wall, doors opening into the room (+Y)
    wf = PY + WT / 2          # wall face
    wx0, wx1 = -8.7, -5.5
    box("wardrobe_carcass", (wx1 - wx0, 0.6, 2.6), ((wx0 + wx1) / 2, wf + 0.3, 1.3), M["walnut"], bevel=0.004)
    box("wardrobe_inside", (wx1 - wx0 - 0.1, 0.02, 2.5), ((wx0 + wx1) / 2, wf + 0.03, 1.3), M["linen"])
    add_collider(wx0, wf, wx1, wf + 0.62)
    for i in range(4):
        x0 = wx0 + i * 0.8
        hinge_x = x0 if i % 2 == 0 else x0 + 0.8
        h = empty(f"wardrobe_door_{i}", (hinge_x, wf + 0.61, 0))
        dx = 0.4 if i % 2 == 0 else -0.4
        box(f"wardrobe_door_{i}_leaf", (0.79, 0.025, 2.55), (hinge_x + dx, wf + 0.615, 1.3), M["walnut"],
            bevel=0.003, parent=h)
        box(f"wardrobe_door_{i}_pull", (0.015, 0.02, 0.5), (hinge_x + dx * 1.85, wf + 0.635, 1.2), M["brass"], parent=h)
        interact(h, "door", "衣櫃", angle=(90 if i % 2 == 0 else -90))
    for i in range(14):
        x = wx0 + 0.15 + i * 0.21
        col = [(0.85, 0.82, 0.76), (0.2, 0.25, 0.35), (0.6, 0.3, 0.28), (0.3, 0.3, 0.3)][i % 4]
        m = material(f"garment_{i % 4}", color=col, albedo="linen_albedo" if i % 2 else None, rough=0.85,
                     tile=(0.4, 0.4))
        cushion(f"garment_{i}", (0.05, 0.48, 1.0 + 0.2 * (i % 3)), (x, wf + 0.3, 1.85 - (0.5 + 0.1 * (i % 3))), m,
                puff=0.45, rot=(0, 0, R(90)))
    tube("wardrobe_rail", [(wx0 + 0.1, wf + 0.3, 2.35), (wx1 - 0.1, wf + 0.3, 2.35)], 0.012, M["brass"])

    build_letter_wall(M, wf)
    build_vitrine(M)

    # Reading corner by the window
    ch = empty("bed_chair", (-4.3, 4.15, 0))
    cushion("bed_chair_seat", (0.75, 0.75, 0.42), (-4.3, 4.15, 0.25), M["boucle"], puff=0.4, parent=ch)
    cushion("bed_chair_back", (0.75, 0.25, 0.55), (-4.3, 4.48, 0.62), M["boucle"], puff=0.45, parent=ch)
    ch.rotation_euler.z = R(25)
    add_collider(-4.75, 3.7, -3.85, 4.6)
    cylinder("bed_side_table", 0.22, 0.03, (-3.5, 4.3, 0.5), M["darkmarble"], segs=40, bevel=0.006)
    cylinder("bed_side_stem", 0.03, 0.5, (-3.5, 4.3, 0.25), M["brass"], segs=16)
    cylinder("bed_side_vase", 0.05, 0.2, (-3.5, 4.3, 0.615), M["ceramic"], r2=0.035, segs=24)
    plant("plant_bed", (-2.0, 4.35), M, 1.7)


def build_letter_wall(M, wf):
    """Writing bureau + linen pin-board of letters. Each envelope opens its own letter."""
    cx = -3.35
    box("bureau_top", (1.8, 0.48, 0.04), (cx, wf + 0.24, 0.78), M["walnut"], bevel=0.008)
    box("bureau_drawers", (1.7, 0.42, 0.16), (cx, wf + 0.23, 0.68), M["walnut"], bevel=0.006)
    box("bureau_drawer_gap", (0.004, 0.005, 0.12), (cx, wf + 0.442, 0.68), M["blackmetal"])
    for dx in (-0.42, 0.42):
        box(f"bureau_pull_{dx}", (0.14, 0.015, 0.012), (cx + dx, wf + 0.45, 0.68), M["brass"])
    for dx in (-0.86, 0.86):
        box(f"bureau_leg_{dx}", (0.035, 0.42, 0.6), (cx + dx, wf + 0.23, 0.3), M["brass"])
    add_collider(cx - 0.92, wf, cx + 0.92, wf + 0.5)
    stool_x = cx + 0.2
    cushion("bureau_stool", (0.42, 0.42, 0.1), (stool_x, wf + 0.82, 0.46), M["velvet"], puff=0.45)
    for a in range(4):
        ang = a * math.pi / 2 + math.pi / 4
        box(f"bureau_stool_leg_{a}", (0.025, 0.025, 0.42), (stool_x + 0.14 * math.cos(ang), wf + 0.82 + 0.14 * math.sin(ang), 0.21),
            M["brass"])
    # Letter box on the bureau: opens the full letter library / writing
    lb = empty("letter_box", (cx - 0.5, wf + 0.25, 0.8))
    box("letter_box_body", (0.34, 0.26, 0.1), (cx - 0.5, wf + 0.25, 0.85), M["leather"], bevel=0.01, parent=lb)
    for i in range(4):
        box(f"letter_box_env_{i}", (0.24, 0.005, 0.15), (cx - 0.5, wf + 0.17 + i * 0.04, 0.93), M["envelope"],
            parent=lb, rot=(R(-8 + i * 3), 0, 0))
    sphere("letter_seal", 0.018, (cx - 0.5, wf + 0.13, 0.95), M["wax"], scale=(1, 0.4, 1), parent=lb)
    interact(lb, "letters", "信箱 · 寫信與全部信件")
    box("bureau_paper", (0.24, 0.32, 0.002), (cx + 0.15, wf + 0.26, 0.801), M["paper"], rot=(0, 0, R(-8)))
    tube("bureau_pen", [(cx + 0.35, wf + 0.16, 0.808), (cx + 0.45, wf + 0.34, 0.808)], 0.005, M["brass"])
    # Pin-board with brass frame
    bz = 1.75
    box("letter_board", (2.3, 0.025, 1.05), (cx, wf + 0.013, bz), M["linen"], bevel=0.004)
    frame = [((2.36, 0.03, 0.03), (cx, wf + 0.02, bz + 0.54)), ((2.36, 0.03, 0.03), (cx, wf + 0.02, bz - 0.54)),
             ((0.03, 0.03, 1.1), (cx - 1.17, wf + 0.02, bz)), ((0.03, 0.03, 1.1), (cx + 1.17, wf + 0.02, bz))]
    multi_box("letter_board_frame", frame, M["brass"], bevel=0.004)
    # warm fairy-light string draped across the board
    pts = [(cx - 1.15 + 2.3 * t / 24, wf + 0.05, bz + 0.48 - 0.12 * math.sin(math.pi * t / 24 * 2) ** 2) for t in range(25)]
    tube("fairy_wire", pts, 0.002, M["blackmetal"])
    bulbs = [((0.022, 0.022, 0.03), p) for p in pts[1::2]]
    multi_box("fairy_bulbs", bulbs, M["bulb"], bevel=0.008, group=None)
    area_light("letter_board_glow", (cx, wf + 0.4, bz + 0.6), (2.0, 0.2), 18, (1.0, 0.78, 0.5),
               rot=(R(60), 0, 0))
    # Six pinned letters / cards, each its own interactable
    slots = [(-0.8, 0.18, 5), (-0.25, 0.22, -4), (0.32, 0.16, 3), (0.85, 0.2, -6), (-0.55, -0.25, -3), (0.55, -0.24, 4)]
    env_mats = [M["envelope"], M["paper"], material("card_blush", color=(0.93, 0.78, 0.76), rough=0.8)]
    for i, (dx, dz, tilt) in enumerate(slots):
        e = empty(f"pinned_letter_{i}", (cx + dx, wf + 0.03, bz + dz))
        w, h = (0.34, 0.24) if i % 2 == 0 else (0.26, 0.34)
        box(f"pinned_letter_{i}_paper", (w, 0.004, h), (cx + dx, wf + 0.03, bz + dz), env_mats[i % 3],
            rot=(0, R(tilt), 0), parent=e)
        if i % 2 == 0:  # envelope flap + wax seal
            box(f"pinned_letter_{i}_flap", (w * 0.98, 0.002, 0.02), (cx + dx, wf + 0.034, bz + dz + h * 0.25),
                M["envelope"], rot=(0, R(tilt), 0), parent=e)
            sphere(f"pinned_letter_{i}_seal", 0.018, (cx + dx, wf + 0.036, bz + dz), M["wax"], scale=(1, 0.35, 1),
                   parent=e)
        sphere(f"pinned_letter_{i}_pin", 0.012, (cx + dx, wf + 0.04, bz + dz + h / 2 - 0.03), M["brass"], parent=e)
        interact(e, "letter", f"信 {i + 1}", index=i)


def build_vitrine(M):
    """Lit glass display cabinet on the partition wall holding eight keepsakes."""
    x1 = -1.2 - WT / 2          # wall face
    x0 = x1 - 0.46
    y0, y1 = 1.1, 3.7
    xc, yc = (x0 + x1) / 2, (y0 + y1) / 2
    carcass = [((0.46, 0.04, 2.2), (xc, y0 + 0.02, 1.1)), ((0.46, 0.04, 2.2), (xc, y1 - 0.02, 1.1)),
               ((0.46, y1 - y0, 0.06), (xc, yc, 2.17)), ((0.46, y1 - y0, 0.14), (xc, yc, 0.07)),
               ((0.02, y1 - y0, 2.2), (x1 - 0.01, yc, 1.1))]
    multi_box("vitrine_carcass", carcass, M["walnut"], bevel=0.004)
    box("vitrine_back", (0.01, y1 - y0 - 0.08, 2.0), (x1 - 0.025, yc, 1.15), M["velvet"])
    shelves_z = [0.62, 1.08, 1.54, 1.98]
    shelf = [((0.4, y1 - y0 - 0.08, 0.025), (xc, yc, z - 0.0125)) for z in shelves_z[:3]]
    multi_box("vitrine_shelves", shelf, M["walnut"], bevel=0.004)
    front = [((0.008, (y1 - y0) / 2 - 0.05, 2.0), (x0 + 0.01, yc + s * (y1 - y0) / 4, 1.16)) for s in (-1, 1)]
    gf = multi_box("vitrine_glass", front, M["glass"], group=None)
    gf["glass"] = 1
    box("vitrine_mullion", (0.02, 0.03, 2.0), (x0 + 0.01, yc, 1.16), M["brass"])
    leds = [((0.3, y1 - y0 - 0.1, 0.006), (xc, yc, z + 0.4)) for z in [0.15] + shelves_z[:3]]
    multi_box("vitrine_leds", leds, M["ledstrip"], group=None)
    for i, z in enumerate([0.15] + shelves_z[:3]):
        area_light(f"vitrine_led_{i}", (xc, yc, z + 0.38), (0.25, y1 - y0 - 0.2), 12, (1.0, 0.86, 0.68))
    add_collider(x0, y0, x1, y1)

    # Keepsakes: two per shelf, each an interactable that opens its story book
    spots = [(0.14, y0 + 0.65), (0.14, y1 - 0.65), (0.62, y0 + 0.65), (0.62, y1 - 0.65),
             (1.08, y0 + 0.65), (1.08, y1 - 0.65), (1.54, y0 + 0.65), (1.54, y1 - 0.65)]
    makers = [_pajamas, _polaroids, _tie_clip, _teddy, _xmas_lantern, _gold520, _diary, _perfume]
    labels = ["Quin's 的睡衣", "拍立得", "領帶夾 · Enrico Coveri", "小熊", "聖誕雪屋音樂盒", "520 黃金大餅", "日記本", "香水"]
    scales = [1.15, 2, 2.2, 2, 1.6, 1.3, 2, 2]
    kinds = ["keepsake"] * 4 + ["snowglobe"] + ["keepsake"] * 3
    for i, ((z, y), make, label, sc, kind) in enumerate(zip(spots, makers, labels, scales, kinds)):
        lift = 0.05 if make in (_polaroids, _teddy, _diary, _perfume) else 0.0
        if lift:  # small walnut plinth + brass label plate under the smaller pieces
            box(f"keepsake_{i}_plinth", (0.26, 0.3, 0.05), (xc, y, z + 0.025), M["walnut"], bevel=0.006)
            box(f"keepsake_{i}_plate", (0.002, 0.1, 0.025), (xc - 0.131, y, z + 0.025), M["brass"])
        root = empty(f"keepsake_{i}", (xc, y, z + lift))
        make(f"keepsake_{i}", xc, y, z + lift, root, M)
        root.scale = (sc, sc, sc)   # pieces are modelled at life size; small ones are displayed larger
        interact(root, kind, label, index=i)


def _pajamas(n, x, y, z, p, M):
    """Quin's charcoal pinstripe satin pajamas in the white PRIFU gift box."""
    paper = material("prifu_white", color=(0.95, 0.945, 0.935), rough=0.6)
    satin = material("pinstripe_satin", albedo="pinstripe_albedo", normal="pinstripe_normal", rough=0.32,
                     tile=(0.14, 0.14), sheen=0.6, normal_strength=0.3)
    cuff = material("cuff_quins", albedo="cuff_quins_albedo", rough=0.32, sheen=0.6)
    art = material("prifu_box_art", albedo="prifu_box_albedo", rough=0.55)
    tx = x - 0.04                                   # tray towards the glass
    tw, tl, th, t = 0.26, 0.36, 0.07, 0.006
    walls = [((tw, tl, t), (tx, y, z + t / 2)),
             ((t, tl, th), (tx - tw / 2 + t / 2, y, z + th / 2)), ((t, tl, th), (tx + tw / 2 - t / 2, y, z + th / 2)),
             ((tw, t, th), (tx, y - tl / 2 + t / 2, z + th / 2)), ((tw, t, th), (tx, y + tl / 2 - t / 2, z + th / 2))]
    multi_box(f"{n}_tray", walls, paper, bevel=0.001, parent=p)
    box(f"{n}_tissue", (tw - 0.02, tl - 0.02, 0.002), (tx, y, z + 0.008), M["paper"], parent=p)
    # folded shirt: collar at the back, placket running towards the viewer
    cushion(f"{n}_shirt", (tw - 0.03, tl - 0.04, 0.04), (tx, y, z + 0.03), satin, puff=0.3, parent=p)
    for s_ in (-1, 1):
        box(f"{n}_lapel_{s_}", (0.075, 0.05, 0.006), (tx + 0.07, y + s_ * 0.03, z + 0.056), satin,
            rot=(0, 0, R(s_ * 32)), parent=p)
    box(f"{n}_collar", (0.03, 0.14, 0.012), (tx + 0.105, y, z + 0.054), satin, bevel=0.004, parent=p)
    for k in range(3):
        cylinder(f"{n}_button_{k}", 0.007, 0.003, (tx + 0.035 - k * 0.055, y, z + 0.058), M["vinyl"], segs=12,
                 parent=p)
    box(f"{n}_pocket", (0.05, 0.045, 0.002), (tx + 0.04, y - 0.08, z + 0.057), satin, parent=p)
    # folded trouser hem laid across the top, embroidered "Quin's."
    band = box(f"{n}_cuff", (0.062, tl - 0.05, 0.01), (tx - 0.065, y, z + 0.063), cuff, bevel=0.002, parent=p)
    band["uvfit"] = "-yx"
    tube(f"{n}_ribbon", [(tx - 0.1, y - 0.2, z + 0.004), (tx - 0.06, y - 0.15, z + 0.07), (tx + 0.02, y - 0.12, z + 0.075),
                         (tx + 0.06, y - 0.2, z + 0.003)], 0.004, paper, parent=p)
    # lid leaning against the back of the vitrine, art facing the room
    lid = box(f"{n}_lid", (tw, tl, 0.014), (0, 0, 0), art, bevel=0.002, parent=None)
    lid["uvfit"] = "-yx"
    lid.location = (x + 0.15, y, z + 0.125)
    lid.rotation_euler = (0, R(-72), 0)
    bpy.context.view_layer.update()
    mw = lid.matrix_world.copy()
    lid.parent = p
    lid.matrix_world = mw


def _xmas_lantern(n, x, y, z, p, M):
    """Antique-bronze flat lantern snow music box (14.5 x 8 x 22 cm): forest, cottages, lamppost."""
    bronze = material("antique_bronze", color=(0.11, 0.07, 0.045), metal=0.85, rough=0.5)
    gilt = material("bronze_gilt", color=(0.45, 0.3, 0.15), metal=1.0, rough=0.35)
    snow = material("fake_snow", color=(0.96, 0.96, 0.98), rough=0.9, emission=(1.0, 0.85, 0.6), night_emission=0.6)
    pine = material("pine", color=(0.08, 0.24, 0.13), rough=0.7)
    W, D = 0.145, 0.08          # width along y, depth along x (front faces -x)
    box(f"{n}_plinth", (D + 0.012, W + 0.012, 0.045), (x, y, z + 0.0225), bronze, bevel=0.004, parent=p)
    box(f"{n}_plinth_trim", (D + 0.016, W + 0.016, 0.006), (x, y, z + 0.046), gilt, bevel=0.002, parent=p)
    box(f"{n}_scroll", (0.002, 0.08, 0.012), (x - D / 2 - 0.007, y, z + 0.024), gilt, bevel=0.003, parent=p)
    for dx in (-1, 1):
        for dy in (-1, 1):
            sphere(f"{n}_foot_{dx}_{dy}", 0.007, (x + dx * D / 2, y + dy * W / 2, z - 0.002), bronze, segs=10, parent=p)
    g0, gh = z + 0.049, 0.105
    posts = [((0.009, 0.009, gh), (x + dx * (D / 2 - 0.004), y + dy * (W / 2 - 0.004), g0 + gh / 2))
             for dx in (-1, 1) for dy in (-1, 1)]
    posts.append(((D, W, 0.008), (x, y, g0 + gh)))
    multi_box(f"{n}_frame", posts, bronze, bevel=0.002, parent=p)
    gl = box(f"{n}_glass", (D - 0.006, W - 0.006, gh - 0.004), (x, y, g0 + gh / 2), M["glass"], group=None, parent=p)
    gl["glass"] = 1
    gl["snowbox"] = 1
    box(f"{n}_snow", (D - 0.01, W - 0.01, 0.012), (x, y, g0 + 0.006), snow, parent=p)
    for k, (dy, h, dx) in enumerate(((0.0, 0.07, 0.0), (-0.035, 0.05, 0.012), (0.04, 0.055, 0.01), (-0.055, 0.035, -0.01),
                                       (0.058, 0.04, -0.012), (0.02, 0.03, 0.022))):
        cylinder(f"{n}_tree_{k}", 0.014 + h * 0.18, h, (x + dx, y + dy, g0 + 0.012 + h / 2), pine, r2=0.001, segs=10,
                 parent=p)
        cylinder(f"{n}_treesnow_{k}", 0.008 + h * 0.1, h * 0.35, (x + dx, y + dy, g0 + 0.012 + h * 0.8), snow,
                 r2=0.0005, segs=10, parent=p)
    sphere(f"{n}_star", 0.006, (x, y, g0 + 0.086), material("star_gold", color=(1, 0.8, 0.3), metal=1, rough=0.2,
                                                           emission=(1, 0.8, 0.4), night_emission=3.0),
           scale=(0.5, 1, 1), segs=8, parent=p)
    for k in range(6):
        a = k * 1.9
        sphere(f"{n}_bauble_{k}", 0.003, (x + 0.012 * math.cos(a) - 0.004, y + 0.012 * math.sin(a), g0 + 0.03 + k * 0.007),
               material("bauble_red", color=(0.8, 0.05, 0.05), rough=0.2), segs=8, parent=p)
    cottage = material("cottage", color=(0.62, 0.32, 0.2), rough=0.6, emission=(1.0, 0.7, 0.35), night_emission=1.5)
    for k, dy in enumerate((-0.028, 0.03)):
        box(f"{n}_house_{k}", (0.022, 0.026, 0.02), (x + 0.018, y + dy, g0 + 0.022), cottage, parent=p)
        box(f"{n}_roof_{k}", (0.026, 0.03, 0.008), (x + 0.018, y + dy, g0 + 0.036), snow, rot=(R(18), 0, 0), parent=p)
    cylinder(f"{n}_lamppost", 0.0015, 0.05, (x - 0.02, y - 0.05, g0 + 0.037), bronze, segs=6, parent=p)
    sphere(f"{n}_lamp", 0.004, (x - 0.02, y - 0.05, g0 + 0.064), M["bulb"], segs=8, parent=p)
    # roof, finial and ring
    box(f"{n}_eaves", (D + 0.03, W + 0.035, 0.008), (x, y, g0 + gh + 0.008), bronze, bevel=0.003, parent=p)
    cylinder(f"{n}_roof", 0.085, 0.04, (x, y, g0 + gh + 0.032), bronze, r2=0.025, segs=4, rot=(0, 0, R(45)),
             parent=p).scale = (0.62, 1.12, 1)
    box(f"{n}_roof_scroll", (0.002, 0.07, 0.01), (x - 0.03, y, g0 + gh + 0.025), gilt, rot=(0, R(-35), 0), parent=p)
    cylinder(f"{n}_finial", 0.012, 0.022, (x, y, g0 + gh + 0.063), bronze, r2=0.008, segs=16, parent=p)
    tube(f"{n}_ring", [(x, y + 0.02 * math.cos(a * math.pi / 10), g0 + gh + 0.096 + 0.022 * math.sin(a * math.pi / 10))
                       for a in range(21)], 0.003, bronze, parent=p)


def _tie_clip(n, x, y, z, p, M):
    """Enrico Coveri tie clip (round disc, garnet stone) in its open grey box + the pink-wrapped gift."""
    grey = material("ec_box", albedo="ec_box_albedo", rough=0.7)
    greyp = material("ec_box_plain", color=(0.6, 0.59, 0.57), rough=0.7)
    leather = material("insert_leather", color=(0.03, 0.03, 0.035), albedo="leather_albedo", normal="leather_normal",
                       rough=0.5, tile=(0.08, 0.08))
    silver = material("rhodium", color=(0.86, 0.87, 0.9), metal=1.0, rough=0.12)
    by = y - 0.03
    box(f"{n}_base", (0.06, 0.1, 0.022), (x, by, z + 0.011), greyp, bevel=0.002, parent=p)
    box(f"{n}_insert", (0.052, 0.092, 0.002), (x, by, z + 0.0225), leather, parent=p)
    lid = box(f"{n}_lid", (0.006, 0.1, 0.06), (x + 0.033, by, z + 0.052), grey, bevel=0.0015, rot=(0, R(-8), 0), parent=p)
    lid["uvfit"] = "-yz"
    box(f"{n}_tab", (0.004, 0.012, 0.012), (x + 0.03, by, z + 0.085), material("ribbon_grey", color=(0.5, 0.5, 0.52),
                                                                               rough=0.4, sheen=0.6), parent=p)
    # the clip: bar + spring blade, disc with engraved ring and a garnet
    box(f"{n}_bar", (0.006, 0.058, 0.0025), (x - 0.004, by + 0.004, z + 0.026), silver, bevel=0.001, parent=p)
    box(f"{n}_blade", (0.0045, 0.05, 0.0015), (x - 0.004, by + 0.008, z + 0.0238), silver, bevel=0.0006, parent=p)
    disc = cylinder(f"{n}_disc", 0.0095, 0.003, (x - 0.004, by - 0.026, z + 0.0265),
                    material("tieclip_disc", albedo="tieclip_disc_albedo", metal=0.9, rough=0.18), segs=40, parent=p)
    disc["uvfit"] = "xy"
    sphere(f"{n}_garnet", 0.0045, (x - 0.004, by - 0.026, z + 0.028),
           material("garnet", color=(0.38, 0.02, 0.14), rough=0.05, coat=1.0), scale=(1, 1, 0.45), segs=16, parent=p)
    # pink striped wrapping with the iridescent star bow
    wy = y + 0.07
    box(f"{n}_wrapped", (0.055, 0.085, 0.032), (x - 0.005, wy, z + 0.016),
        material("wrap_coral", color=(0.93, 0.45, 0.42), rough=0.35, coat=0.5), bevel=0.002, parent=p)
    bow = material("bow_iridescent", color=(0.92, 0.66, 0.85), metal=0.6, rough=0.18, coat=1.0)
    for k in range(10):
        a = k * 2 * math.pi / 10
        cylinder(f"{n}_bow_{k}", 0.006, 0.022, (x - 0.005 + 0.009 * math.cos(a), wy + 0.009 * math.sin(a), z + 0.04),
                 bow, r2=0.0005, segs=8, rot=(R(62), 0, a + math.pi / 2),
                 parent=p)
    sphere(f"{n}_bow_core", 0.009, (x - 0.005, wy, z + 0.042), bow, scale=(1, 1, 0.8), segs=12, parent=p)


def _gold520(n, x, y, z, p, M):
    """Round rose box with satin 'forever love' ribbon, the 520 gold coin on its stand, and the card."""
    cream = material("hatbox_cream", color=(0.93, 0.86, 0.68), metal=0.2, rough=0.4)
    goldband = material("hatbox_gold", color=(0.8, 0.62, 0.32), metal=1.0, rough=0.3)
    satin = material("satin_dusty_pink", color=(0.72, 0.5, 0.46), rough=0.3, sheen=0.8)
    rose = material("rose_soft_pink", color=(0.86, 0.52, 0.6), rough=0.6, sheen=0.4)
    hy = y - 0.06
    cylinder(f"{n}_hatbox", 0.07, 0.075, (x, hy, z + 0.0375), cream, segs=48, parent=p)
    cylinder(f"{n}_hatband", 0.0705, 0.012, (x, hy, z + 0.008), goldband, segs=48, parent=p)
    for k in range(13):
        a = k * 2.4
        r = 0.05 * math.sqrt(k / 13)
        rx, ry = x + r * math.cos(a), hy + r * math.sin(a)
        sphere(f"{n}_rose_{k}", 0.019, (rx, ry, z + 0.085), rose, scale=(1, 1, 0.7), segs=14, parent=p)
        cylinder(f"{n}_petal_{k}", 0.021, 0.006, (rx, ry, z + 0.079), rose, r2=0.024, segs=14, parent=p)
    for ang in (0, 90):
        tube(f"{n}_ribbon_{ang}", [(x + 0.074 * math.cos(math.radians(ang)) * s_, hy + 0.074 * math.sin(math.radians(ang)) * s_,
                                    z + (0.0 if abs(s_) > 0.9 else 0.09 + 0.012 * (1 - s_ * s_)))
                                   for s_ in (-1, -0.95, -0.6, 0, 0.6, 0.95, 1)], 0.003, satin, parent=p)
    for s_ in (-1, 1):
        sphere(f"{n}_bowloop_{s_}", 0.022, (x + s_ * 0.018, hy, z + 0.112), satin, scale=(1, 0.35, 0.6), segs=12,
               rot=(0, R(s_ * 25), 0), parent=p)
    # coin standing in a clear ring on a red velvet stand, facing the room
    cy_ = y + 0.075
    box(f"{n}_stand", (0.05, 0.075, 0.018), (x + 0.005, cy_, z + 0.009), material("stand_red", color=(0.5, 0.05, 0.07),
                                                                                  rough=0.7, sheen=1.0), bevel=0.004,
        parent=p)
    coin = cylinder(f"{n}_coin", 0.034, 0.005, (x, cy_, z + 0.054),
                    material("coin520", albedo="coin520_albedo", normal="coin520_normal", metal=1.0, rough=0.22,
                             normal_strength=0.8), segs=64, rot=(0, R(-90), 0), parent=p)
    coin["uvfit"] = "-yx"   # local x points up after the -90 deg turn; the face looks at the room
    ring = cylinder(f"{n}_acrylic", 0.038, 0.012, (x, cy_, z + 0.054), M["glass"], segs=48, rot=(0, R(90), 0),
                    group=None, parent=p)
    ring["glass"] = 1
    card = box(f"{n}_card", (0.055, 0.066, 0.002), (x - 0.06, y + 0.005, z + 0.001),
               material("bestwishes_card", albedo="bestwishes_card_albedo", rough=0.8), rot=(0, 0, R(-8)), parent=p)
    card["uvfit"] = "-yx"


def _ring_box(n, x, y, z, p, M):
    velvet = material("ring_velvet", color=(0.45, 0.05, 0.1), rough=0.7, sheen=1.0)
    box(f"{n}_base", (0.09, 0.09, 0.05), (x, y, z + 0.025), velvet, bevel=0.015, parent=p)
    box(f"{n}_lid", (0.09, 0.012, 0.07), (x - 0.01, y + 0.045, z + 0.085), velvet, bevel=0.005, rot=(R(-15), 0, 0),
        parent=p)
    tube(f"{n}_ring", [(x + 0.012 * math.cos(a * math.pi / 8), y, z + 0.075 + 0.012 * math.sin(a * math.pi / 8))
                       for a in range(17)], 0.0025, M["brass"], parent=p)
    sphere(f"{n}_stone", 0.006, (x, y, z + 0.09), material("diamond", color=(0.95, 0.97, 1.0), rough=0.02, metal=0.3),
           segs=10, parent=p)


def _music_box(n, x, y, z, p, M):
    box(f"{n}_body", (0.16, 0.22, 0.1), (x, y, z + 0.05), M["walnut"], bevel=0.008, parent=p)
    box(f"{n}_inlay", (0.12, 0.17, 0.002), (x, y, z + 0.101), M["brass"], parent=p)
    cylinder(f"{n}_crank", 0.005, 0.05, (x, y - 0.13, z + 0.05), M["brass"], rot=(R(90), 0, 0), segs=8, parent=p)
    sphere(f"{n}_ballerina", 0.012, (x, y, z + 0.13), M["ceramic"], scale=(1, 1, 2.2), parent=p)


def _perfume(n, x, y, z, p, M):
    glass = material("perfume_glass", color=(0.95, 0.8, 0.85), rough=0.05, coat=1.0)
    box(f"{n}_bottle", (0.08, 0.08, 0.1), (x, y, z + 0.05), glass, bevel=0.02, parent=p)
    cylinder(f"{n}_neck", 0.012, 0.02, (x, y, z + 0.11), M["brass"], segs=12, parent=p)
    sphere(f"{n}_cap", 0.025, (x, y, z + 0.14), M["brass"], scale=(1, 1, 0.8), segs=16, parent=p)
    box(f"{n}_box", (0.09, 0.03, 0.12), (x, y + 0.09, z + 0.06), material("perfume_box", color=(0.95, 0.93, 0.9),
                                                                          rough=0.5), bevel=0.003, parent=p)


def _polaroids(n, x, y, z, p, M):
    for k in range(3):
        box(f"{n}_frame_{k}", (0.004, 0.09, 0.11), (x - 0.03 + k * 0.012, y - 0.06 + k * 0.06, z + 0.055 + k * 0.004),
            M["paper"], rot=(0, R(-12), R(8 * (k - 1))), parent=p)
        box(f"{n}_img_{k}", (0.005, 0.075, 0.075), (x - 0.03 + k * 0.012, y - 0.06 + k * 0.06, z + 0.065 + k * 0.004),
            M[f"photo{k + 3}"], rot=(0, R(-12), R(8 * (k - 1))), parent=p)


def _flower_box(n, x, y, z, p, M):
    cylinder(f"{n}_hatbox", 0.09, 0.09, (x, y, z + 0.045), material("hatbox", color=(0.12, 0.12, 0.13), rough=0.4),
             segs=40, parent=p)
    rose = material("rose", color=(0.78, 0.08, 0.16), rough=0.6, sheen=0.6)
    blush = material("rose_blush", color=(0.95, 0.68, 0.72), rough=0.6, sheen=0.6)
    for k in range(9):
        a = k * 2.4
        r = 0.055 * math.sqrt(k / 9)
        sphere(f"{n}_rose_{k}", 0.026, (x + r * math.cos(a), y + r * math.sin(a), z + 0.1), rose if k % 3 else blush,
               scale=(1, 1, 0.75), segs=12, parent=p)


def _snow_globe(n, x, y, z, p, M):
    cylinder(f"{n}_base", 0.06, 0.04, (x, y, z + 0.02), M["walnut"], r2=0.05, segs=32, parent=p)
    box(f"{n}_house", (0.035, 0.035, 0.03), (x, y, z + 0.065), M["gift"], parent=p)
    g = sphere(f"{n}_glass", 0.06, (x, y, z + 0.095), M["glass"], segs=24, group=None, parent=p)
    g["glass"] = 1


def _teddy(n, x, y, z, p, M):
    fur = material("teddy_fur", color=(0.62, 0.45, 0.3), albedo="boucle_albedo", rough=1.0, tile=(0.1, 0.1), sheen=1.0)
    sphere(f"{n}_body", 0.05, (x, y, z + 0.05), fur, scale=(1, 0.9, 1.1), segs=16, parent=p)
    sphere(f"{n}_head", 0.038, (x - 0.01, y, z + 0.125), fur, segs=16, parent=p)
    for s in (-1, 1):
        sphere(f"{n}_ear_{s}", 0.014, (x - 0.01, y + s * 0.03, z + 0.155), fur, segs=10, parent=p)
        sphere(f"{n}_arm_{s}", 0.018, (x - 0.02, y + s * 0.05, z + 0.07), fur, scale=(1, 1, 1.4), segs=10, parent=p)
    sphere(f"{n}_nose", 0.008, (x - 0.045, y, z + 0.12), M["vinyl"], segs=8, parent=p)
    box(f"{n}_bow", (0.01, 0.05, 0.015), (x - 0.04, y, z + 0.09), M["gift"], parent=p)


def _diary(n, x, y, z, p, M):
    cover = material("diary_cover", color=(0.36, 0.18, 0.12), albedo="leather_albedo", normal="leather_normal",
                     rough=0.5, tile=(0.3, 0.3))
    box(f"{n}_cover", (0.15, 0.2, 0.035), (x, y, z + 0.018), cover, bevel=0.006, rot=(0, 0, R(10)), parent=p)
    box(f"{n}_pages", (0.14, 0.19, 0.028), (x + 0.004, y, z + 0.018), M["paper"], rot=(0, 0, R(10)), parent=p)
    box(f"{n}_ribbon", (0.006, 0.004, 0.06), (x, y - 0.095, z + 0.0), M["gift"], parent=p)


def build_study(M):
    """Memory study x[-9, -1.27] y[-5, -0.67]: gallery wall, desk, library, reading corner."""
    sf = PY - WT / 2   # study face of the partition
    rug = extrude_poly("rug_study", rounded_rect(3.0, 2.4, 0.06), 0.014, (-5.2, -2.8, 0.0), M["rug2"])
    rug["uvfit"] = 1
    # Desk against the bedroom wall
    dx0 = -4.4
    d = empty("desk", (dx0, sf - 0.4, 0))
    box("desk_top", (1.7, 0.75, 0.04), (dx0, sf - 0.4, 0.75), M["walnut"], bevel=0.008, parent=d)
    for ddx in (-0.8, 0.8):
        box(f"desk_leg_{ddx}", (0.04, 0.68, 0.73), (dx0 + ddx, sf - 0.4, 0.365), M["brass"], parent=d)
    box("desk_drawer", (0.6, 0.6, 0.1), (dx0 - 0.45, sf - 0.4, 0.68), M["walnut"], bevel=0.006, parent=d)
    add_collider(dx0 - 0.88, sf - 0.8, dx0 + 0.88, sf)
    dc = empty("desk_chair", (dx0, sf - 1.1, 0))
    cushion("desk_chair_seat", (0.5, 0.5, 0.08), (dx0, sf - 1.1, 0.47), M["leather"], puff=0.4, parent=dc)
    cushion("desk_chair_back", (0.48, 0.06, 0.4), (dx0, sf - 1.37, 0.78), M["leather"], puff=0.4, rot=(R(10), 0, 0),
            parent=dc)
    for ddx in (-0.21, 0.21):
        for ddy in (-0.21, 0.21):
            box(f"desk_chair_leg_{ddx}_{ddy}", (0.03, 0.03, 0.44), (dx0 + ddx, sf - 1.1 + ddy, 0.22), M["blackmetal"],
                parent=dc)
    add_collider(dx0 - 0.3, sf - 1.4, dx0 + 0.3, sf - 0.8)
    box("desk_paper", (0.24, 0.32, 0.002), (dx0 - 0.1, sf - 0.45, 0.771), M["paper"], rot=(0, 0, R(-8)))
    tube("desk_pen", [(dx0 + 0.1, sf - 0.55, 0.778), (dx0 + 0.2, sf - 0.37, 0.778)], 0.005, M["brass"])
    for k in range(3):
        box(f"desk_book_{k}", (0.22, 0.16, 0.03), (dx0 + 0.55, sf - 0.3, 0.785 + k * 0.032), M[f"book{k}"],
            bevel=0.003, rot=(0, 0, R(6 * k - 6)))
    cylinder("desk_lamp_base", 0.08, 0.02, (dx0 - 0.65, sf - 0.2, 0.78), M["brass"], segs=32)
    tube("desk_lamp_arm", [(dx0 - 0.65, sf - 0.2, 0.78), (dx0 - 0.62, sf - 0.25, 1.15), (dx0 - 0.45, sf - 0.4, 1.22)],
         0.008, M["brass"])
    s = cylinder("desk_lamp_shade", 0.09, 0.12, (dx0 - 0.42, sf - 0.42, 1.17), M["brass"], r2=0.03, segs=32)
    interact(s, "lamp", "檯燈", light="desk_lamp")
    sphere("desk_lamp_bulb", 0.03, (dx0 - 0.42, sf - 0.42, 1.12), M["bulb"])["lamp_group"] = "desk_lamp"
    point_light("desk_lamp", (dx0 - 0.42, sf - 0.42, 1.08), 20, (1.0, 0.76, 0.5), 0.05)

    # Memory gallery on the west wall: 7 frames
    frames = [(-4.0, 1.95, 0.8, 0.6), (-3.0, 2.05, 0.6, 0.8), (-2.05, 1.9, 0.8, 0.6),
              (-3.95, 1.25, 0.6, 0.45), (-3.05, 1.2, 0.5, 0.5), (-2.1, 1.25, 0.6, 0.45), (-1.25, 1.6, 0.5, 0.75)]
    for i, (y, z, w, h) in enumerate(frames):
        g = empty(f"frame_{i}", (XW + 0.03, y, z))
        box(f"frame_{i}_wood", (0.035, w, h), (XW + 0.025, y, z), M["walnut"], bevel=0.006, parent=g)
        box(f"frame_{i}_mat", (0.01, w - 0.06, h - 0.06), (XW + 0.045, y, z), M["mat"], parent=g)
        p = box(f"frame_{i}_photo", (0.004, w - 0.16, h - 0.16), (XW + 0.052, y, z), M[f"photo{i}"], parent=g)
        p["uvfit"] = "yz"
        interact(p, "photo", f"回憶相框 {i + 1}", index=i)
    box("gallery_light", (0.12, 3.6, 0.04), (XW + 0.1, -2.6, 2.55), M["brass"], bevel=0.01)
    box("gallery_light_led", (0.08, 3.5, 0.004), (XW + 0.1, -2.6, 2.528), M["ledstrip"], group=None)
    area_light("gallery_led", (XW + 0.15, -2.6, 2.5), (0.06, 3.4), 40, (1.0, 0.85, 0.65), night_only=True,
               rot=(R(-35), 0, R(90)))

    # Bookshelf along the south wall
    bx0 = -8.6
    shelf = [((0.03, 0.34, 2.4), (bx0 + i * 0.92, -4.82, 1.2)) for i in range(6)]
    shelf += [((4.63, 0.34, 0.025), (bx0 + 2.3, -4.82, 0.04 + j * 0.46)) for j in range(6)]
    multi_box("bookshelf", shelf, M["walnut"], bevel=0.003)
    add_collider(bx0 - 0.05, -5.0, bx0 + 4.65, -4.62)
    rnd = random.Random(7)
    books = {i: [] for i in range(6)}
    for j in range(5):
        for bay in range(5):
            x = bx0 + 0.04 + bay * 0.92
            end = x + 0.86
            if rnd.random() < 0.25:
                continue
            while x < end - 0.05:
                w = rnd.uniform(0.025, 0.05)
                h = rnd.uniform(0.25, 0.38)
                books[rnd.randrange(6)].append(((w, rnd.uniform(0.18, 0.24), h),
                                                (x + w / 2, -4.84, 0.055 + j * 0.46 + h / 2)))
                x += w + 0.002
                if rnd.random() < 0.04:
                    x += 0.12
    for i, bl in books.items():
        if bl:
            multi_box(f"books_{i}", bl, M[f"book{i}"], bevel=0.002)

    # Reading chair + floor lamp
    rc = empty("reading_chair", (-2.2, -4.0, 0))
    cushion("reading_seat", (0.8, 0.8, 0.42), (-2.2, -4.0, 0.25), M["leather"], puff=0.35, parent=rc)
    cushion("reading_back", (0.8, 0.22, 0.6), (-2.2, -4.35, 0.68), M["leather"], puff=0.4, parent=rc)
    for ddx in (-0.37, 0.37):
        cushion(f"reading_arm_{ddx}", (0.14, 0.8, 0.5), (-2.2 + ddx, -4.0, 0.42), M["leather"], puff=0.45, parent=rc)
    rc.rotation_euler.z = R(-30)
    add_collider(-2.7, -4.55, -1.6, -3.5)
    cylinder("reading_lamp_base", 0.15, 0.03, (-1.6, -4.62, 0.015), M["blackmetal"], segs=32)
    cylinder("reading_lamp_pole", 0.012, 1.45, (-1.6, -4.62, 0.74), M["brass"], segs=12)
    s = cylinder("reading_lamp_shade", 0.2, 0.3, (-1.6, -4.62, 1.55), M["shade"], r2=0.17, segs=40)
    interact(s, "lamp", "閱讀燈", light="reading_lamp")
    s["lamp_group"] = "reading_lamp"
    point_light("reading_lamp", (-1.6, -4.62, 1.5), 35, (1.0, 0.72, 0.45), 0.1)
    plant("plant_study", (-8.55, -0.95), M, 1.5)


def build_doors(M):
    # Bedroom door: hinge at the north jamb (y=0.53), swinging into the bedroom
    h = empty("bedroom_door", (-1.2 - WT / 2 + 0.02, 0.53, 0))
    box("bedroom_door_leaf", (0.04, 0.96, 2.22), (-1.2 - WT / 2 + 0.02, 0.05, 1.11), M["walnut"], bevel=0.004, parent=h)
    for sx in (-1, 1):
        cylinder(f"bedroom_door_knob_{sx}", 0.022, 0.07, (-1.2 - WT / 2 + 0.02 + sx * 0.04, -0.33, 1.0), M["brass"],
                 segs=16, rot=(0, R(90), 0), parent=h)
    interact(h, "door", "臥室門", angle=-95, open=0)
    trims = []
    for x in (-1.2 - WT / 2 - 0.01, -1.2 + WT / 2 + 0.01):
        trims += [((0.02, 0.06, 2.28), (x, -0.48, 1.14)), ((0.02, 0.06, 2.28), (x, 0.58, 1.14)),
                  ((0.02, 1.12, 0.06), (x, 0.05, 2.28))]
        trims += [((0.02, 0.06, 2.48), (x, -3.33, 1.24)), ((0.02, 0.06, 2.48), (x, -1.97, 1.24)),
                  ((0.02, 1.4, 0.06), (x, -2.65, 2.48))]
    multi_box("door_trims", trims, M["satin"], bevel=0.004)


# Lights ----------------------------------------------------------------------
def point_light(name, loc, watts, color, radius, group=None, night_only=True):
    ld = bpy.data.lights.new(name + "_L", "POINT")
    ld.energy = watts
    ld.color = color
    ld.shadow_soft_size = radius
    ob = bpy.data.objects.new(name + "_L", ld)
    collection("BakeLights").objects.link(ob)
    ob.location = loc
    (LIGHTS_NIGHT if night_only else LIGHTS_DAY).append(ob)
    return ob


def area_light(name, loc, size, watts, color, night_only=True, rot=(0, 0, 0)):
    ld = bpy.data.lights.new(name + "_L", "AREA")
    ld.shape = "RECTANGLE"
    ld.size, ld.size_y = size
    ld.energy = watts
    ld.color = color
    ob = bpy.data.objects.new(name + "_L", ld)
    collection("BakeLights").objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    (LIGHTS_NIGHT if night_only else LIGHTS_DAY).append(ob)
    return ob


def spot(name, loc, watts, color=(1.0, 0.82, 0.62), angle=70):
    ld = bpy.data.lights.new(name + "_L", "SPOT")
    ld.energy = watts
    ld.color = color
    ld.spot_size = R(angle)
    ld.spot_blend = 0.6
    ld.shadow_soft_size = 0.04
    ob = bpy.data.objects.new(name + "_L", ld)
    collection("BakeLights").objects.link(ob)
    ob.location = loc
    LIGHTS_NIGHT.append(ob)
    return ob


def build_ceiling_lights(M):
    # recessed downlights (mesh rings) + spot lights for the night bake
    spots = [(-7.4, 0.9), (-4.6, 1.0), (-7.4, 4.1), (-4.6, 3.9), (-2.5, 2.4),  # bedroom
             (-7.4, -1.7), (-4.2, -1.9), (-7.4, -3.9), (-4.2, -3.9), (-2.4, -3.2),  # study
             (0.4, -3.2), (3.0, -3.2), (0.4, -1.7), (3.0, -1.7),             # kitchen
             (5.8, -4.0), (5.8, -2.5), (-0.4, 0.0), (5.8, 0.4)]               # entry / circulation
    discs = []
    for i, (x, y) in enumerate(spots):
        discs.append(((0.09, 0.09, 0.006), (x, y, H - 0.002)))
        spot(f"downlight_{i}", (x, y, H - 0.02), 32)
    multi_box("downlights", discs, M["downlight"], group=None)
    # ceiling LED slots in living (area lights, facing down)
    for x in (2.4, 5.0):
        area_light(f"slot_living_{x}", (x, 2.75, H - 0.03), (0.05, 4.1), 110, (1.0, 0.82, 0.62))
    area_light("slot_kitchen", (1.9, -3.85, H - 0.03), (5.1, 0.05), 55, (1.0, 0.84, 0.66))


def build(M=None):
    M = M or make_materials()
    build_shell(M)
    build_glazing(M)
    build_curtains(M)
    build_living(M)
    build_dining(M)
    build_kitchen(M)
    build_entry(M)
    build_bedroom(M)
    build_study(M)
    build_doors(M)
    build_ceiling_lights(M)
    return M
