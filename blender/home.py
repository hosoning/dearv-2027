"""DearV big flat (大平層) — layout from the owners' floor-plan brief.

Blender space: X east, Y north (the harbour glazing), Z up, metres. Plan "top" is the
entrance (south, y = YS) and plan "bottom" is the full-height glass (north, y = YN).

             x=-15            -6.2        1.2        6.2           11
  y=-10  ┌─────────────────────┬──────────┬──door───┬─────────────┐
         │  BEDROOM (sleeping) │ KITCHEN  │ FOYER   │             │
         │  bed, vitrine,      │ (open)   ├─────────┤   STUDY     │
         │  letter wall        │          │ gallery │  desk + PC, │
  y=-3.5 ├────────┬──vest.─────┤          │ walkway │  books,     │
         │ CLOSET │ vestibule  ├──────────┴────door─┤  travel wall│
         │        │            │ DINING              ├─────────────┤ y=-0.5
  y=0.9  ├────────┴──door──────┤                                   │
         │ BATHROOM (tub at    door  LIVING  (sofa → TV wall east)  │
         │ the glass)          │                                   │
  y=7    └═════════════════ full-height harbour glazing ════════════┘
"""
from __future__ import annotations

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

import apartment as A
import lib
from lib import (add_collider, box, cushion, cylinder, empty, extrude_poly, material, multi_box, placed,
                 rounded_rect, sphere, tube)

XW, XE, YS, YN = -15.0, 11.0, -10.0, 7.0
H = 3.2
WT = 0.14
EXT = 0.25
SUITE_X = -6.2      # suite / kitchen-dining-living wall
STUDY_X = 6.2       # walkway / study wall
STUDY_Y = -0.5      # study / living wall
BATH_Y = 0.9        # vestibule+closet / bathroom wall
CLOSET_Y = -3.5     # closet / sleeping-area wall
CLOSET_X = -9.6     # closet / vestibule boundary (open)
R = math.radians
interact = A.interact


def mats(M):
    M["plush"] = material("plush_beige_grey", color=(0.70, 0.66, 0.61), albedo="plush_albedo", normal="plush_normal",
                          rough=0.92, tile=(0.35, 0.35), normal_strength=0.6, sheen=0.9)
    M["bath_stone"] = material("bath_marble", albedo="marble_albedo", rough_map="marble_rough", tile=(2.4, 2.4), coat=0.4)
    M["porcelain"] = material("porcelain", color=(0.95, 0.95, 0.94), rough=0.12, coat=0.8)
    M["wool_navy"] = material("wool_navy", color=(0.11, 0.14, 0.24), albedo="wool_albedo", normal="wool_normal",
                              rough=0.8, tile=(0.15, 0.15), sheen=0.4)
    M["wool_char"] = material("wool_charcoal", color=(0.16, 0.16, 0.17), albedo="wool_albedo", normal="wool_normal",
                              rough=0.8, tile=(0.15, 0.15), sheen=0.4)
    M["wool_camel"] = material("wool_camel", color=(0.68, 0.52, 0.34), albedo="wool_albedo", normal="wool_normal",
                               rough=0.85, tile=(0.15, 0.15), sheen=0.5)
    M["tweed"] = material("tweed", albedo="tweed_albedo", rough=0.9, tile=(0.2, 0.2), sheen=0.4)
    M["shirt_white"] = material("shirt_white", color=(0.94, 0.94, 0.92), albedo="linen_albedo", rough=0.7, tile=(0.2, 0.2))
    M["shirt_blue"] = material("shirt_blue", color=(0.62, 0.72, 0.86), albedo="linen_albedo", rough=0.7, tile=(0.2, 0.2))
    for key, col in (("silk_black", (0.02, 0.02, 0.025)), ("silk_champagne", (0.86, 0.74, 0.58)),
                     ("silk_red", (0.5, 0.03, 0.06)), ("silk_blush", (0.9, 0.7, 0.68)), ("silk_ivory", (0.93, 0.9, 0.84)),
                     ("silk_emerald", (0.03, 0.25, 0.16))):
        M[key] = material(key, color=col, rough=0.3, sheen=0.8, coat=0.2)
    M["trench"] = material("trench_beige", color=(0.72, 0.6, 0.44), albedo="linen_albedo", rough=0.75, tile=(0.2, 0.2))
    for b in ("hermes", "chanel", "dior", "loropiana", "tomford", "cartier"):
        M[f"brand_{b}"] = material(f"brand_{b}", albedo=f"brand_{b}_albedo", rough=0.5)
    M["map"] = material("world_map", albedo="world_map_albedo", rough=0.8)
    M["alu"] = material("aluminium", color=(0.8, 0.81, 0.83), metal=1.0, rough=0.25)
    M["screen"] = material("pc_screen", color=(0.01, 0.01, 0.012), rough=0.1)
    M["glass_frost"] = material("frosted_glass", color=(0.9, 0.93, 0.94), rough=0.3, alpha=0.45)
    M["towel"] = material("towel", color=(0.93, 0.91, 0.87), albedo="boucle_albedo", rough=1.0, tile=(0.2, 0.2))
    M["water"] = material("bath_water", color=(0.75, 0.88, 0.92), rough=0.02, alpha=0.5)
    M["leather_tan"] = material("leather_tan", color=(0.55, 0.33, 0.17), albedo="leather_albedo",
                                normal="leather_normal", rough=0.45, tile=(0.3, 0.3))
    M["bag_orange"] = material("bag_orange", color=(0.86, 0.4, 0.12), albedo="leather_albedo", rough=0.45, tile=(0.2, 0.2))
    M["bag_black"] = material("bag_black", color=(0.03, 0.03, 0.03), albedo="leather_albedo", rough=0.4, tile=(0.2, 0.2))
    M["bag_etoupe"] = material("bag_etoupe", color=(0.45, 0.4, 0.34), albedo="leather_albedo", rough=0.45, tile=(0.2, 0.2))
    M["gold"] = material("gold", color=(0.95, 0.75, 0.38), metal=1.0, rough=0.2)
    M["velvet_tray"] = material("velvet_tray", color=(0.12, 0.13, 0.16), rough=0.9, sheen=1.0)
    M["mirror"] = material("mirror", color=(0.95, 0.95, 0.95), metal=1.0, rough=0.02)
    M["halo"] = material("mirror_halo", color=(1, 0.95, 0.88), emission=(1.0, 0.85, 0.65), night_emission=6.0)
    return M


# ---------------------------------------------------------------------------
def wall(M, name, x0, y0, x1, y1, z0=0.0, z1=H, collide=True, mat=None):
    ob = box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), mat or M["plaster"],
             group="arch")
    if collide and z0 < 1.0:
        add_collider(x0, y0, x1, y1)
    return ob


SKIRT: list = []


def skirt(x0, y0, x1, y1):
    """Skirting strip on the floor line from (x0,y0) to (x1,y1) (axis aligned)."""
    if abs(x1 - x0) > abs(y1 - y0):
        SKIRT.append(((abs(x1 - x0), 0.018, 0.09), ((x0 + x1) / 2, y0, 0.045)))
    else:
        SKIRT.append(((0.018, abs(y1 - y0), 0.09), (x0, (y0 + y1) / 2, 0.045)))


def build_shell(M):
    A_ = "arch"
    # Floors (non-overlapping rectangles)
    def floor(name, x0, y0, x1, y1, mat):
        box(name, (x1 - x0, y1 - y0, 0.1), ((x0 + x1) / 2, (y0 + y1) / 2, -0.05), mat, group=A_)
    floor("floor_marble_foyer", 1.2, YS, STUDY_X, -7.6, M["marble"])
    floor("floor_terrazzo_kitchen", SUITE_X, YS, 1.2, -3.5, M["terrazzo"])
    floor("floor_bath", XW, BATH_Y, SUITE_X, YN, M["bath_stone"])
    floor("floor_oak_suite", XW, YS, SUITE_X, BATH_Y, M["oak"])
    floor("floor_oak_walk", 1.2, -7.6, STUDY_X, -3.5, M["oak"])
    floor("floor_oak_study", STUDY_X, YS, XE, STUDY_Y, M["oak"])
    floor("floor_oak_living", SUITE_X, -3.5, STUDY_X, YN, M["oak"])
    floor("floor_oak_living_e", STUDY_X, STUDY_Y, XE, YN, M["oak"])
    box("ceiling", (XE - XW + 0.5, YN - YS + 0.5, 0.12), ((XW + XE) / 2, (YS + YN) / 2, H + 0.06), M["ceiling"], group=A_)

    # Exterior walls (north is all glass; west/east have glazed runs)
    wall(M, "wall_south_a", XW - EXT, YS - EXT, 3.2, YS)
    wall(M, "wall_south_b", 4.4, YS - EXT, XE + EXT, YS)
    wall(M, "wall_south_lintel", 3.2, YS - EXT, 4.4, YS, 2.45, H, collide=False)
    for name, y0, y1 in (("wall_west_a", YS - EXT, -9.7), ("wall_west_b", -3.8, 1.2), ("wall_west_c", 6.8, YN)):
        wall(M, name, XW - EXT, y0, XW, y1)
    for name, y0, y1 in (("wall_east_a", YS - EXT, -9.7), ("wall_east_b", -1.0, YN)):
        wall(M, name, XE, y0, XE + EXT, y1)
    skirt(XW + 0.01, YS + 0.01, 3.2, YS + 0.01); skirt(4.4, YS + 0.01, XE - 0.01, YS + 0.01)
    skirt(XW + 0.01, -3.8, XW + 0.01, 1.2)
    skirt(XE - 0.01, -1.0, XE - 0.01, YN - 0.2)

    # Interior walls
    sx0, sx1 = SUITE_X - WT / 2, SUITE_X + WT / 2
    for name, y0, y1 in (("suite_wall_a", YS, -1.5), ("suite_wall_b", -0.4, 3.0), ("suite_wall_c", 3.9, YN - 0.12)):
        wall(M, name, sx0, y0, sx1, y1)
        skirt(sx0 - 0.009, y0, sx0 - 0.009, y1); skirt(sx1 + 0.009, y0, sx1 + 0.009, y1)
    wall(M, "suite_lintel_bed", sx0, -1.5, sx1, -0.4, 2.3, H, collide=False)
    wall(M, "suite_lintel_bath", sx0, 3.0, sx1, 3.9, 2.3, H, collide=False)
    by0, by1 = BATH_Y - WT / 2, BATH_Y + WT / 2
    wall(M, "bath_wall_a", XW, by0, -8.4, by1)
    wall(M, "bath_wall_b", -7.4, by0, sx0, by1)
    wall(M, "bath_lintel", -8.4, by0, -7.4, by1, 2.3, H, collide=False)
    for x0, x1 in ((XW + 0.01, -8.4), (-7.4, sx0)):
        skirt(x0, by0 - 0.009, x1, by0 - 0.009); skirt(x0, by1 + 0.009, x1, by1 + 0.009)
    cy0, cy1 = CLOSET_Y - WT / 2, CLOSET_Y + WT / 2
    wall(M, "closet_wall", XW, cy0, CLOSET_X, cy1)
    skirt(XW + 0.01, cy0 - 0.009, CLOSET_X, cy0 - 0.009)
    box("closet_pier", (0.3, 0.3, H), (CLOSET_X, 0.75, H / 2), M["plaster"], group=A_)
    tx0, tx1 = STUDY_X - WT / 2, STUDY_X + WT / 2
    wall(M, "study_wall_a", tx0, YS, tx1, -4.4)
    wall(M, "study_wall_b", tx0, -2.8, tx1, STUDY_Y)
    wall(M, "study_lintel", tx0, -4.4, tx1, -2.8, 2.45, H, collide=False)
    for y0, y1 in ((YS + 0.01, -4.4), (-2.8, STUDY_Y)):
        skirt(tx0 - 0.009, y0, tx0 - 0.009, y1); skirt(tx1 + 0.009, y0, tx1 + 0.009, y1)
    ty0, ty1 = STUDY_Y - WT / 2, STUDY_Y + WT / 2
    wall(M, "study_wall_n", tx1, ty0, XE, ty1)
    skirt(tx1, ty0 - 0.009, XE, ty0 - 0.009); skirt(tx1, ty1 + 0.009, XE, ty1 + 0.009)
    multi_box("skirting", SKIRT, M["satin"], group=A_)

    # Ceiling details: linear light slots over living, kitchen and the walkway
    slots = [((0.05, 5.6, 0.02), (x, 3.3, H - 0.005)) for x in (6.6, 9.4)]
    slots += [((6.0, 0.05, 0.02), (-2.5, -8.8, H - 0.005)), ((0.05, 3.6, 0.02), (3.7, -5.6, H - 0.005))]
    multi_box("ceiling_led_slots", slots, M["ledstrip"], group=None)
    box("pelmet", (XE - XW, 0.36, 0.22), ((XW + XE) / 2, YN - 0.38, H - 0.11), M["ceiling"], group=A_)
    box("pelmet_west", (0.36, 5.9, 0.22), (XW + 0.38, -6.75, H - 0.11), M["ceiling"], group=A_)


def glazing_run(M, name, axis, line, a0, a1, inward):
    """Floor-to-ceiling curtain wall. axis='x': runs along x at y=line; 'y': along y at x=line."""
    n = max(1, round((a1 - a0) / 1.55))
    stations = [a0 + i * (a1 - a0) / n for i in range(n + 1)]
    gh = H - 0.3
    mull, panes = [], []
    def at(a, t, size):
        return (size, (a, line, t)) if axis == "x" else ((size[1], size[0], size[2]), (line, a, t))
    for a in stations:
        mull.append(at(a, gh / 2 + 0.02, (0.07, 0.14, gh)))
    L = a1 - a0
    mull.append(at((a0 + a1) / 2, 0.035, (L, 0.14, 0.07)))
    mull.append(at((a0 + a1) / 2, gh, (L, 0.14, 0.08)))
    for p, q in zip(stations[:-1], stations[1:]):
        panes.append(at((p + q) / 2, gh / 2, (q - p - 0.07, 0.02, gh - 0.1)))
    multi_box(f"{name}_mullions", mull, M["bronze"], bevel=0.006)
    g = multi_box(f"{name}_glass", panes, M["glass"], group=None)
    g["glass"] = 1
    if axis == "x":
        add_collider(a0, line - 0.2, a1, line + 0.2)
    else:
        add_collider(line - 0.2, a0, line + 0.2, a1)
    # bulkhead above the glazing
    if axis == "x":
        box(f"{name}_head", (L, 0.3, H - gh + 0.05), ((a0 + a1) / 2, line, (gh + H) / 2), M["plaster"], group="arch")
    else:
        box(f"{name}_head", (0.3, L, H - gh + 0.05), (line, (a0 + a1) / 2, (gh + H) / 2), M["plaster"], group="arch")


def build_glazing(M):
    glazing_run(M, "glaze_n", "x", YN, XW, XE, -1)
    glazing_run(M, "glaze_w_bed", "y", XW, -9.7, -3.8, 1)
    glazing_run(M, "glaze_w_bath", "y", XW, 1.2, 6.8, 1)
    glazing_run(M, "glaze_e_study", "y", XE, -9.7, -1.0, -1)
    box("facade_band", (XE - XW + 0.6, 0.3, 0.45), ((XW + XE) / 2, YN + 0.15, H + 0.1), M["facade"], group="arch")


def curtain(M, name, axis, line, anchor, direction, width, mat, open_scale, offset):
    """Pleated curtain hung `offset` inside the glass; scale.x animates (1 = closed)."""
    bm = bmesh.new()
    cols, rows = int(width / 0.025), 12
    height = H - 0.34
    grid = []
    for j in range(rows + 1):
        row = []
        for i in range(cols + 1):
            u = i / cols
            amp = 0.045 * (0.85 + 0.15 * math.sin(j * 0.7))
            row.append(bm.verts.new((u * width, math.sin(u * width / 0.16 * 2 * math.pi) * amp, height * j / rows)))
        grid.append(row)
    for j in range(rows):
        for i in range(cols):
            bm.faces.new([grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]])
    if axis == "x":
        loc, rot = (anchor, line + offset, 0.03), (0, 0, 0 if direction > 0 else math.pi)
    else:
        loc, rot = (line + offset, anchor, 0.03), (0, 0, math.pi / 2 if direction > 0 else -math.pi / 2)
    ob = lib._finish(name, bm, mat, loc, rot, None, None, angle=80)
    ob["open_scale"] = open_scale
    ob["curtain"] = 1
    ob.scale.x = open_scale
    return ob


def build_curtains(M):
    half = (XE - SUITE_X) / 2
    curtain(M, "curtain_living_w", "x", YN, SUITE_X + 0.1, 1, half - 0.1, M["sheer"], 0.1, -0.22)
    curtain(M, "curtain_living_e", "x", YN, XE - 0.1, -1, half - 0.1, M["sheer"], 0.1, -0.22)
    curtain(M, "curtain_bath_w", "x", YN, XW + 0.1, 1, 4.3, M["sheer"], 0.12, -0.22)
    curtain(M, "curtain_bath_e", "x", YN, SUITE_X - 0.1, -1, 4.3, M["sheer"], 0.12, -0.22)
    curtain(M, "curtain_bed_s", "y", XW, -9.6, 1, 2.9, M["blackout"], 0.14, 0.22)
    curtain(M, "curtain_bed_n", "y", XW, -3.9, -1, 2.9, M["blackout"], 0.14, 0.22)
    curtain(M, "curtain_study_s", "y", XE, -9.6, 1, 4.2, M["sheer"], 0.12, -0.22)
    curtain(M, "curtain_study_n", "y", XE, -1.1, -1, 4.2, M["sheer"], 0.12, -0.22)
    for name, label, target, loc, rz in (
            ("curtain_switch_living", "窗簾 · 客廳", "curtain_living", (XE - 0.07, 6.2, 1.15), 90),
            ("curtain_switch_bed", "窗簾 · 睡房", "curtain_bed", (SUITE_X - WT / 2 - 0.006, -4.0, 1.15), 90),
            ("curtain_switch_bath", "窗簾 · 浴室", "curtain_bath", (SUITE_X - WT / 2 - 0.006, 4.3, 1.15), 90),
            ("curtain_switch_study", "窗簾 · 書房", "curtain_study", (STUDY_X + WT / 2 + 0.006, -2.4, 1.15), 90)):
        sw = box(name, (0.08, 0.012, 0.12), loc, M["satin"], rot=(0, 0, R(rz)))
        interact(sw, "curtains", label, target=target)


# ---------------------------------------------------------------------------
def hinged_door(M, name, axis, line, a0, a1, hinge_at_end, angle, label, mat=None, glass=False, height=2.25):
    """Door leaf in an opening of a wall. axis='x': wall runs along y at x=line (leaf spans y a0..a1)."""
    hinge = a1 if hinge_at_end else a0
    w = a1 - a0 - 0.02
    mid = (a0 + a1) / 2
    if axis == "x":
        h = empty(name, (line, hinge, 0))
        size, center = (0.045, w, height - 0.02), (line, mid, (height - 0.02) / 2)
        knob = (line, a0 + 0.08 if hinge_at_end else a1 - 0.08)
    else:
        h = empty(name, (hinge, line, 0))
        size, center = (w, 0.045, height - 0.02), (mid, line, (height - 0.02) / 2)
        knob = (a0 + 0.08 if hinge_at_end else a1 - 0.08, line)
    leaf_mat = M["glass_frost"] if glass else (mat or M["walnut"])
    leaf = box(f"{name}_leaf", size, center, leaf_mat, bevel=0.004, parent=h, group=None if glass else "furn")
    if glass:
        leaf["glass"] = 1
        fx = [((size[0] + 0.01, size[1] + 0.01, 0.04), (center[0], center[1], 0.02)),
              ((size[0] + 0.01, size[1] + 0.01, 0.04), (center[0], center[1], height - 0.04))]
        multi_box(f"{name}_frame", fx, M["bronze"], parent=h)
    for s_ in (-1, 1):
        off = (s_ * 0.04, 0) if axis == "x" else (0, s_ * 0.04)
        cylinder(f"{name}_knob_{s_}", 0.018, 0.12 if glass else 0.06, (knob[0] + off[0], knob[1] + off[1], 1.0),
                 M["brass"], segs=16, rot=(0, R(90), 0) if axis == "x" else (R(90), 0, 0), parent=h)
    interact(h, "door", label, angle=angle)
    # architraves
    t = []
    for s_ in (-1, 1):
        o = WT / 2 + 0.01
        if axis == "x":
            t += [((0.02, 0.06, height + 0.06), (line + s_ * o, a0 - 0.03, (height + 0.06) / 2)),
                  ((0.02, 0.06, height + 0.06), (line + s_ * o, a1 + 0.03, (height + 0.06) / 2)),
                  ((0.02, a1 - a0 + 0.12, 0.06), (line + s_ * o, mid, height + 0.03))]
        else:
            t += [((0.06, 0.02, height + 0.06), (a0 - 0.03, line + s_ * o, (height + 0.06) / 2)),
                  ((0.06, 0.02, height + 0.06), (a1 + 0.03, line + s_ * o, (height + 0.06) / 2)),
                  ((a1 - a0 + 0.12, 0.02, 0.06), (mid, line + s_ * o, height + 0.03))]
    multi_box(f"{name}_trim", t, M["satin"], bevel=0.003)
    return h


def build_doors(M):
    hinged_door(M, "bedroom_door", "x", SUITE_X, -1.5, -0.4, True, -95, "主人房門", height=2.28)
    hinged_door(M, "bath_door_living", "x", SUITE_X, 3.0, 3.9, True, -95, "浴室門", height=2.28)
    hinged_door(M, "bath_door_suite", "y", BATH_Y, -8.4, -7.4, False, 95, "浴室門", height=2.28)
    hinged_door(M, "study_door_s", "x", STUDY_X, -4.4, -3.6, False, -100, "書房門", glass=True, height=2.43)
    hinged_door(M, "study_door_n", "x", STUDY_X, -3.6, -2.8, True, 100, "書房門", glass=True, height=2.43)


# ---------------------------------------------------------------------------
def build_entry(M):
    """Foyer: front door, tall shoe cabinet with a bench niche, console + mirror, pendant."""
    d = empty("front_door_hinge", (3.22, YS - 0.05, 0))
    box("front_door_leaf", (1.16, 0.06, 2.4), (3.8, YS - 0.05, 1.2), M["walnut"], bevel=0.006, parent=d)
    box("front_door_pull", (0.03, 0.05, 1.2), (4.25, YS + 0.01, 1.15), M["brass"], bevel=0.01, parent=d)
    box("front_door_lock", (0.07, 0.02, 0.16), (4.25, YS, 1.5), M["tvbody"], bevel=0.008, parent=d)
    interact(d, "door", "大門", angle=-80)
    add_collider(3.2, YS - 0.4, 4.4, YS)
    frame = [((0.06, 0.32, 2.48), (3.17, YS - 0.12, 1.24)), ((0.06, 0.32, 2.48), (4.43, YS - 0.12, 1.24)),
             ((1.32, 0.32, 0.06), (3.8, YS - 0.12, 2.47))]
    multi_box("front_door_frame", frame, M["satin"], bevel=0.004)
    lobby = material("lobby_wall", color=(0.85, 0.78, 0.68), emission=(1, 0.85, 0.65), emission_strength=0.6)
    box("lobby_floor", (2.6, 2.0, 0.1), (3.8, YS - 1.3, -0.05), M["marble"], group=None)
    box("lobby_back", (2.6, 0.1, H), (3.8, YS - 2.3, H / 2), lobby, group=None)
    for sx in (-1, 1):
        box(f"lobby_side_{sx}", (0.1, 2.0, H), (3.8 + sx * 1.25, YS - 1.3, H / 2), M["satin"], group=None)
    box("lobby_ceiling", (2.6, 2.0, 0.1), (3.8, YS - 1.3, H), M["satin"], group=None)
    # tall shoe cabinet (separates foyer from kitchen) with a lit bench niche
    x0, x1 = 1.2, 1.66
    box("shoe_cab_low", (x1 - x0, 2.3, 0.45), ((x0 + x1) / 2, -8.75, 0.225), M["walnut"], bevel=0.004)
    box("shoe_cab_high", (x1 - x0, 2.3, H - 1.15), ((x0 + x1) / 2, -8.75, 1.15 + (H - 1.15) / 2), M["walnut"], bevel=0.004)
    cushion("shoe_bench_pad", (0.4, 1.2, 0.06), ((x0 + x1) / 2 + 0.02, -9.0, 0.48), M["leather"], puff=0.4)
    box("shoe_niche_back", (0.02, 2.3, 0.7), (x0 + 0.01, -8.75, 0.8), M["oakfurn"])
    box("shoe_niche_led", (0.4, 2.2, 0.006), ((x0 + x1) / 2, -8.75, 1.145), M["ledstrip"], group=None)
    slats = [((0.012, 0.025, H - 1.2), (x1 + 0.006, -9.85 + i * 0.05, 1.15 + (H - 1.15) / 2)) for i in range(45)]
    multi_box("shoe_cab_slats", slats, M["walnut"])
    add_collider(x0, -9.9, x1 + 0.02, -7.6)
    for k, (yy, col) in enumerate(((-9.6, (0.05, 0.05, 0.05)), (-9.42, (0.9, 0.9, 0.88)), (-8.2, (0.55, 0.33, 0.17)))):
        m_ = material(f"shoe_{k}", color=col, rough=0.4)
        for s_ in (-1, 1):
            cushion(f"entry_shoe_{k}_{s_}", (0.28, 0.1, 0.09), (x1 + 0.25, yy + s_ * 0.06, 0.05), m_, puff=0.45)
    # console + mirror on the study wall
    cx = STUDY_X - WT / 2
    box("entry_console", (0.36, 1.6, 0.06), (cx - 0.2, -8.9, 0.86), M["walnut"], bevel=0.01)
    for dy in (-0.75, 0.75):
        box(f"entry_console_leg_{dy}", (0.3, 0.03, 0.86), (cx - 0.2, -8.9 + dy, 0.43), M["brass"])
    add_collider(cx - 0.4, -9.75, cx, -8.05)
    cylinder("entry_mirror", 0.55, 0.02, (cx - 0.015, -8.9, 1.8), M["mirror"], segs=64, rot=(0, R(90), 0))
    cylinder("entry_mirror_frame", 0.57, 0.015, (cx - 0.008, -8.9, 1.8), M["brass"], segs=64, rot=(0, R(90), 0))
    cylinder("entry_bowl", 0.12, 0.05, (cx - 0.2, -8.5, 0.915), M["ceramic"], r2=0.07, segs=32)
    cylinder("entry_vase", 0.06, 0.32, (cx - 0.2, -9.3, 1.05), M["ceramic"], r2=0.04, segs=32)
    box("entry_mat", (1.1, 0.7, 0.012), (3.8, YS + 0.6, 0.006), M["rug2"])
    A.pendant_globe("foyer_pendant", (3.8, -8.8, 2.2), M)


def build_gallery(M):
    """The quiet walkway: memory photographs on the study wall, a long bench."""
    wx = STUDY_X - WT / 2 - 0.03
    frames = [(-7.15, 1.75, 0.7, 0.9), (-6.25, 1.95, 0.8, 0.6), (-6.25, 1.25, 0.8, 0.55), (-5.35, 1.7, 0.6, 0.8),
              (-4.75, 2.05, 0.4, 0.4), (-4.75, 1.45, 0.4, 0.5), (-7.15, 0.95, 0.5, 0.4)]
    for i, (y, z, w, h) in enumerate(frames):
        g = empty(f"frame_{i}", (wx, y, z))
        box(f"frame_{i}_wood", (0.035, w, h), (wx, y, z), M["walnut"], bevel=0.006, parent=g)
        box(f"frame_{i}_mat", (0.01, w - 0.06, h - 0.06), (wx - 0.02, y, z), M["mat"], parent=g)
        p = box(f"frame_{i}_photo", (0.004, w - 0.16, h - 0.16), (wx - 0.027, y, z), M[f"photo{i}"], parent=g)
        p["uvfit"] = "-yz"
        interact(p, "photo", f"回憶相框 {i + 1}", index=i)
    box("gallery_rail", (0.1, 3.2, 0.04), (wx - 0.08, -6.0, 2.6), M["brass"], bevel=0.01)
    box("gallery_led", (0.07, 3.1, 0.004), (wx - 0.08, -6.0, 2.578), M["ledstrip"], group=None)
    A.area_light("gallery_led", (wx - 0.3, -6.0, 2.5), (0.06, 3.0), 40, (1.0, 0.85, 0.65), rot=(R(35), 0, R(90)))


# ---------------------------------------------------------------------------
def plush_sofa(M, xb, y0, y1, chaise_len=1.9):
    """Low L-shaped short-pile sofa facing +X: back at xb, main run y0..y1, chaise at the y1 end."""
    root = empty("sofa", (xb + 0.5, (y0 + y1) / 2, 0))
    D, L = 1.08, y1 - y0
    yc = (y0 + y1) / 2
    multi_box("sofa_plinth", [((D - 0.1, L - 0.1, 0.08), (xb + D / 2, yc, 0.07)),
                              ((chaise_len - 0.1, D - 0.1, 0.08), (xb + D + chaise_len / 2 - 0.05, y1 - D / 2, 0.07))],
              M["blackmetal"], bevel=0.01, parent=root)
    cushion("sofa_base_main", (D, L, 0.24), (xb + D / 2, yc, 0.23), M["plush"], puff=0.16, parent=root)
    cushion("sofa_base_chaise", (chaise_len, D, 0.24), (xb + D + chaise_len / 2 - 0.02, y1 - D / 2, 0.23), M["plush"],
            puff=0.16, parent=root)
    n = max(3, round(L / 1.05))
    seat_w = (L - 0.25) / n
    for i in range(n):
        y = y0 + 0.05 + seat_w * (i + 0.5)
        c = cushion(f"sofa_seat_{i}", (D - 0.22, seat_w - 0.02, 0.17), (xb + 0.22 + (D - 0.22) / 2, y, 0.435),
                    M["plush"], puff=0.42, parent=root)
        pts = [(xb + 0.24 + x, y + yy, 0.52) for x, yy in rounded_rect(D - 0.3, seat_w - 0.1, 0.08, 4)]
        tube(f"sofa_welt_{i}", pts + [pts[0]], 0.006, M["plush"], parent=root)
        cushion(f"sofa_back_{i}", (0.26, seat_w - 0.04, 0.56), (xb + 0.2, y, 0.74), M["plush"], puff=0.45,
                rot=(0, R(-10), 0), parent=root)
        if i == n // 2:
            c_mid = c
    cushion("sofa_seat_chaise", (chaise_len - 0.1, D - 0.2, 0.17), (xb + D + chaise_len / 2 - 0.05, y1 - D / 2 - 0.05, 0.435),
            M["plush"], puff=0.42, parent=root)
    cushion("sofa_back_frame", (0.22, L, 0.62), (xb + 0.11, yc, 0.55), M["plush"], puff=0.3, parent=root)
    cushion("sofa_arm", (D, 0.24, 0.5), (xb + D / 2, y0 - 0.1, 0.5), M["plush"], puff=0.42, parent=root)
    cushion("sofa_chaise_back", (chaise_len, 0.22, 0.5), (xb + D + chaise_len / 2 - 0.05, y1 + 0.06, 0.55), M["plush"],
            puff=0.4, parent=root)
    for k, (dy, m_, rz) in enumerate(((0.25, "velvet", -6), (0.75, "linen", 5), (L - 0.6, "leather", 8),
                                      (L - 1.1, "velvet", -4))):
        cushion(f"pillow_{k}", (0.15, 0.5, 0.48), (xb + 0.36, y0 + dy, 0.8), M[m_], puff=0.48,
                rot=(R(4), R(-16), R(rz)), parent=root)
    cushion("throw", (0.55, 1.1, 0.05), (xb + D + 1.0, y1 - D / 2, 0.57), M["linen"], puff=0.45,
            rot=(0, R(-3), R(6)), parent=root)
    add_collider(xb, y0 - 0.22, xb + D, y1 + 0.17)
    add_collider(xb + D, y1 - D, xb + D + chaise_len, y1 + 0.17)
    empty("sofa_seat_point", (xb + 0.55, yc, 1.12))
    empty("sofa_look", (XE - 0.1, yc, 1.3))
    interact(c_mid, "sit", "坐下休息", seat="sofa_seat_point", look="sofa_look")
    return root


def armchair(M, name, x, y, rz, mat):
    ch = empty(name, (x, y, 0))
    cushion(f"{name}_seat", (0.78, 0.8, 0.2), (x, y - 0.05, 0.36), mat, puff=0.35, parent=ch)
    cushion(f"{name}_back", (0.78, 0.18, 0.62), (x, y + 0.35, 0.68), mat, puff=0.4, rot=(R(-12), 0, 0), parent=ch)
    for dx in (-0.36, 0.36):
        box(f"{name}_arm_{dx}", (0.06, 0.78, 0.06), (x + dx, y, 0.56), M["walnut"], bevel=0.02, parent=ch)
        box(f"{name}_leg_f_{dx}", (0.05, 0.05, 0.56), (x + dx, y - 0.35, 0.28), M["walnut"], bevel=0.015,
            rot=(R(-6), 0, 0), parent=ch)
        box(f"{name}_leg_b_{dx}", (0.05, 0.05, 0.56), (x + dx, y + 0.35, 0.28), M["walnut"], bevel=0.015,
            rot=(R(8), 0, 0), parent=ch)
    ch.rotation_euler.z = R(rz)
    add_collider(x - 0.48, y - 0.48, x + 0.48, y + 0.48)


def build_living(M):
    rug = extrude_poly("rug_living", rounded_rect(5.4, 5.6, 0.1), 0.016, (7.9, 3.2, 0.0), M["rug"])
    rug["uvfit"] = 1
    plush_sofa(M, 5.15, 0.8, 5.6)
    # coffee tables: long travertine-like block + round dark marble
    box("coffee_long_top", (0.9, 1.6, 0.06), (8.15, 2.9, 0.36), M["marble"], bevel=0.015)
    box("coffee_long_base", (0.7, 1.3, 0.3), (8.15, 2.9, 0.16), M["walnut"], bevel=0.01)
    cylinder("coffee_round_top", 0.42, 0.04, (8.35, 4.3, 0.3), M["darkmarble"], segs=64, bevel=0.008)
    cylinder("coffee_round_stem", 0.05, 0.28, (8.35, 4.3, 0.14), M["brass"], segs=16)
    add_collider(7.65, 2.05, 8.8, 4.75)
    box("ct_book_a", (0.32, 0.24, 0.04), (8.05, 2.6, 0.41), M["book2"], bevel=0.003, rot=(0, 0, R(10)))
    box("ct_book_b", (0.28, 0.21, 0.03), (8.06, 2.6, 0.445), M["book1"], bevel=0.003, rot=(0, 0, R(3)))
    cylinder("ct_vase", 0.08, 0.28, (8.25, 3.35, 0.53), M["ceramic"], r2=0.05, segs=32)
    for i in range(5):
        a = i * 1.3
        tube(f"ct_branch_{i}", [(8.25, 3.35, 0.62), (8.25 + 0.08 * math.cos(a), 3.35 + 0.08 * math.sin(a), 0.88),
                                 (8.25 + 0.22 * math.cos(a), 3.35 + 0.2 * math.sin(a), 1.08 + 0.05 * i)], 0.006, M["trunk"])
    cylinder("ct_candle", 0.045, 0.1, (8.4, 4.3, 0.37), M["ceramic"], segs=24)
    # TV wall (east)
    tvx = XE - 0.07
    slats = [((0.02, 0.035, H - 0.02), (tvx, 0.6 + i * 0.06, (H - 0.02) / 2)) for i in range(97)]
    multi_box("tv_slats", slats, M["walnut"], group="arch")
    box("tv_slat_back", (0.01, 5.85, H - 0.02), (tvx + 0.012, 3.5, (H - 0.02) / 2), M["blackmetal"], group="arch")
    box("tv_console", (0.44, 3.4, 0.34), (tvx - 0.26, 3.4, 0.42), M["walnut"], bevel=0.008)
    box("tv_console_shadow", (0.38, 3.3, 0.02), (tvx - 0.24, 3.4, 0.245), M["blackmetal"])
    add_collider(tvx - 0.5, 1.6, XE, 5.2)
    box("tv_body", (0.05, 1.9, 1.08), (tvx - 0.05, 3.4, 1.55), M["tvbody"], bevel=0.004)
    scr = box("tv_screen", (0.006, 1.87, 1.05), (tvx - 0.078, 3.4, 1.55), M["tvscreen"])
    scr["uvfit"] = "-yz"
    interact(scr, "tv", "電視 · 回憶投影")
    for k, dy in enumerate((-1.2, 1.2)):
        box(f"speaker_{k}", (0.2, 0.18, 0.5), (tvx - 0.28, 3.4 + dy, 0.84), M["tvbody"], bevel=0.02)
    cylinder("console_vase", 0.07, 0.32, (tvx - 0.28, 2.3, 0.75), M["ceramic"], r2=0.03, segs=32)
    sphere("console_orb", 0.1, (tvx - 0.28, 4.5, 0.69), M["darkmarble"])
    # arc lamp behind the sofa, side table + lamp at the arm
    cylinder("arc_lamp_base", 0.2, 0.05, (4.85, 5.9, 0.025), M["darkmarble"], segs=48, bevel=0.01)
    pts = [(4.85 + 1.25 * t, 5.9 - 0.9 * t, 0.05 + 2.1 * math.sin(t * math.pi * 0.62)) for t in [i / 15 for i in range(16)]]
    tube("arc_lamp_stem", pts, 0.012, M["brass"])
    shade = sphere("arc_lamp_shade", 0.2, (6.1, 5.0, 1.85), M["brass"], scale=(1, 1, 0.55))
    sphere("arc_lamp_bulb", 0.07, (6.1, 5.0, 1.79), M["bulb"])["lamp_group"] = "arc_lamp"
    interact(shade, "lamp", "落地燈", light="arc_lamp")
    A.point_light("arc_lamp", (6.1, 5.0, 1.7), 60, (1.0, 0.75, 0.48), 0.1)
    cylinder("side_table", 0.25, 0.03, (5.4, 0.25, 0.55), M["darkmarble"], segs=40, bevel=0.006)
    cylinder("side_table_stem", 0.03, 0.55, (5.4, 0.25, 0.275), M["brass"], segs=16)
    cylinder("side_lamp_base", 0.08, 0.28, (5.4, 0.25, 0.71), M["ceramic"], r2=0.06, segs=32)
    s = cylinder("side_lamp_shade", 0.18, 0.22, (5.4, 0.25, 0.97), M["shade"], r2=0.14, segs=40)
    s["lamp_group"] = "side_lamp"
    interact(s, "lamp", "檯燈", light="side_lamp")
    A.point_light("side_lamp", (5.4, 0.25, 0.94), 30, (1.0, 0.72, 0.45), 0.08)
    armchair(M, "lounge_chair_n", 9.6, 6.1, 150, M["leather"])
    armchair(M, "lounge_chair_s", 9.7, 0.5, 30, M["boucle"])
    A.plant("plant_living_e", (10.5, 6.45), M, 2.2)
    A.plant("plant_living_m", (3.6, 6.4), M, 1.9)
    # Music corner by the suite wall: sideboard with the turntable, two armchairs
    sx = SUITE_X + WT / 2
    box("sideboard", (0.46, 2.4, 0.66), (sx + 0.24, 1.75, 0.37), M["walnut"], bevel=0.006)
    box("sideboard_gap", (0.005, 0.004, 0.6), (sx + 0.472, 1.75, 0.37), M["blackmetal"])
    for dy in (-1.1, 1.1):
        box(f"sideboard_leg_{dy}", (0.4, 0.04, 0.04), (sx + 0.24, 1.75 + dy, 0.02), M["brass"])
    add_collider(sx, 0.5, sx + 0.5, 3.0)
    tt_y = 1.3
    box("turntable_plinth", (0.36, 0.44, 0.07), (sx + 0.24, tt_y, 0.735), M["walnut"], bevel=0.008)
    platter = cylinder("turntable_platter", 0.15, 0.015, (sx + 0.24, tt_y, 0.778), M["chrome"], segs=48)
    rec = cylinder("turntable_record", 0.148, 0.004, (sx + 0.24, tt_y, 0.788), M["vinyl"], segs=64)
    cylinder("turntable_label", 0.045, 0.001, (sx + 0.24, tt_y, 0.7905), M["label"], segs=32, parent=rec)
    rec.parent = platter
    rec.matrix_parent_inverse = platter.matrix_world.inverted()
    platter["spin"] = 1
    tube("turntable_arm", [(sx + 0.36, tt_y + 0.18, 0.81), (sx + 0.36, tt_y, 0.81), (sx + 0.3, tt_y - 0.09, 0.805)],
         0.005, M["chrome"])
    interact(platter, "music", "黑膠唱機 · 播放音樂")
    for k in range(14):
        box(f"vinyl_sleeve_{k}", (0.31, 0.006, 0.31), (sx + 0.24, 2.2 + k * 0.012, 0.86),
            [M["book0"], M["book1"], M["book2"], M["book3"], M["book4"]][k % 5], rot=(R(-4 + k % 3 * 3), 0, 0))
    armchair(M, "music_chair_a", -4.3, 0.6, 115, M["velvet"])
    armchair(M, "music_chair_b", -4.3, 2.9, 65, M["velvet"])
    cylinder("music_table", 0.3, 0.03, (-4.6, 1.75, 0.5), M["walnut"], segs=40, bevel=0.006)
    cylinder("music_table_stem", 0.04, 0.5, (-4.6, 1.75, 0.25), M["brass"], segs=16)
    add_collider(-4.9, 1.45, -4.3, 2.05)
    # Window daybed in the west half
    box("daybed_frame", (2.0, 0.85, 0.3), (-1.8, 6.15, 0.15), M["walnut"], bevel=0.02)
    cushion("daybed_pad", (1.95, 0.8, 0.14), (-1.8, 6.15, 0.37), M["plush"], puff=0.35)
    cushion("daybed_bolster", (0.3, 0.75, 0.3), (-2.7, 6.15, 0.55), M["linen"], puff=0.48)
    add_collider(-2.8, 5.72, -0.8, 6.58)
    A.plant("plant_living_w", (-5.6, 6.4), M, 2.0)


def build_dining(M):
    placed(A.build_dining, M, rot=90, loc=(0.7, -2.1), name="dining_group")


def build_kitchen(M):
    placed(A.build_kitchen, M, loc=(-4.9, -5.0), name="kitchen_group")


# ---------------------------------------------------------------------------
def bookcase(M, name, x0, y0, length, axis, facing, depth=0.38, height=2.9, seed=7, bays_w=0.9):
    """Full-height bookcase with books. axis='x' runs along x at y=y0 (facing ±y)."""
    nb = max(1, round(length / bays_w))
    bw = length / nb
    parts, rnd = [], random.Random(seed)
    shelves_z = [0.04 + j * 0.42 for j in range(int(height / 0.42) + 1)]
    def P(a, b, c, along, across, z):
        if axis == "x":
            return ((a, b, c), (x0 + along, y0 + facing * across, z))
        return ((b, a, c), (x0 + facing * across, y0 + along, z))
    for i in range(nb + 1):
        parts.append(P(0.03, depth, height, i * bw, depth / 2, height / 2))
    for z in shelves_z:
        parts.append(P(length, depth, 0.025, length / 2, depth / 2, z))
    parts.append(P(length, 0.015, height, length / 2, 0.008, height / 2))
    multi_box(f"{name}_case", parts, M["walnut"], bevel=0.003)
    if axis == "x":
        add_collider(x0, min(y0, y0 + facing * depth), x0 + length, max(y0, y0 + facing * depth))
    else:
        add_collider(min(x0, x0 + facing * depth), y0, max(x0, x0 + facing * depth), y0 + length)
    books = {i: [] for i in range(6)}
    for j, z in enumerate(shelves_z[:-1]):
        for bay in range(nb):
            a = bay * bw + 0.04
            end = a + bw - 0.08
            if rnd.random() < 0.22:
                continue
            while a < end - 0.05:
                w = rnd.uniform(0.025, 0.055)
                h = rnd.uniform(0.24, 0.36)
                books[rnd.randrange(6)].append(P(w, rnd.uniform(0.18, 0.26), h, a + w / 2, depth * 0.55, z + 0.013 + h / 2))
                a += w + 0.002
                if rnd.random() < 0.05:
                    a += 0.14
    for i, bl in books.items():
        if bl:
            multi_box(f"{name}_books_{i}", bl, M[f"book{i}"], bevel=0.002)


def build_study(M):
    rug = extrude_poly("rug_study", rounded_rect(3.4, 4.2, 0.08), 0.014, (8.4, -5.6, 0.0), M["rug2"])
    rug["uvfit"] = 1
    # Big desk, user sits facing the window (east); the screen faces the room
    dx, dy = 8.6, -5.6
    box("desk_top", (1.1, 2.8, 0.05), (dx, dy, 0.75), M["walnut"], bevel=0.01)
    box("desk_inlay", (0.6, 1.0, 0.004), (dx + 0.1, dy - 0.6, 0.777), M["leather"])
    for sy in (-1, 1):
        box(f"desk_pedestal_{sy}", (0.95, 0.5, 0.72), (dx, dy + sy * 1.1, 0.36), M["walnut"], bevel=0.006)
        for k in range(3):
            box(f"desk_drawer_gap_{sy}_{k}", (0.005, 0.44, 0.004), (dx - 0.477, dy + sy * 1.1, 0.2 + k * 0.2), M["blackmetal"])
            box(f"desk_pull_{sy}_{k}", (0.012, 0.12, 0.012), (dx - 0.485, dy + sy * 1.1, 0.28 + k * 0.2), M["brass"])
    add_collider(dx - 0.56, dy - 1.42, dx + 0.56, dy + 1.42)
    # iMac-style computer: thin aluminium display on a stand, keyboard + mouse
    mx, my = dx + 0.28, dy
    pc = empty("computer", (mx, my, 0.78))
    box("pc_stand_foot", (0.18, 0.2, 0.008), (mx + 0.02, my, 0.782), M["alu"], bevel=0.004, parent=pc)
    box("pc_stand_arm", (0.02, 0.16, 0.3), (mx + 0.06, my, 0.93), M["alu"], bevel=0.004, rot=(0, R(-12), 0), parent=pc)
    box("pc_body", (0.016, 0.62, 0.4), (mx + 0.02, my, 1.14), M["alu"], bevel=0.006, parent=pc)
    box("pc_bezel", (0.004, 0.6, 0.36), (mx + 0.01, my, 1.155), M["tvbody"], parent=pc)
    scr = box("pc_screen", (0.003, 0.58, 0.33), (mx + 0.007, my, 1.16), M["screen"], parent=pc)
    scr["uvfit"] = "-yz"
    interact(pc, "computer", "電腦 · 打開")
    box("pc_keyboard", (0.13, 0.36, 0.008), (dx - 0.18, dy, 0.779), M["alu"], bevel=0.003)
    sphere("pc_mouse", 0.03, (dx - 0.16, dy - 0.3, 0.785), M["satin"], scale=(1.6, 1, 0.5))
    # desk lamp + things
    cylinder("desk_lamp_base", 0.08, 0.02, (dx + 0.35, dy + 1.1, 0.785), M["brass"], segs=32)
    tube("desk_lamp_arm", [(dx + 0.35, dy + 1.1, 0.79), (dx + 0.32, dy + 1.05, 1.2), (dx + 0.1, dy + 0.85, 1.28)], 0.008, M["brass"])
    s = cylinder("desk_lamp_shade", 0.1, 0.13, (dx + 0.07, dy + 0.83, 1.22), M["brass"], r2=0.035, segs=32)
    sphere("desk_lamp_bulb", 0.03, (dx + 0.07, dy + 0.83, 1.17), M["bulb"])["lamp_group"] = "desk_lamp"
    interact(s, "lamp", "檯燈", light="desk_lamp")
    A.point_light("desk_lamp", (dx + 0.07, dy + 0.83, 1.12), 22, (1.0, 0.76, 0.5), 0.05)
    cylinder("pen_cup", 0.04, 0.11, (dx + 0.35, dy - 1.0, 0.83), M["leather"], segs=24)
    for k in range(4):
        tube(f"pen_{k}", [(dx + 0.35 + 0.01 * math.cos(k), dy - 1.0 + 0.01 * math.sin(k), 0.84),
                          (dx + 0.35 + 0.025 * math.cos(k), dy - 1.0 + 0.025 * math.sin(k), 0.97)], 0.004,
             [M["brass"], M["blackmetal"], M["book1"], M["book0"]][k])
    box("desk_notebook", (0.2, 0.28, 0.02), (dx - 0.15, dy - 0.85, 0.785), M["leather_tan"], bevel=0.004, rot=(0, 0, R(8)))
    box("desk_photo", (0.02, 0.16, 0.2), (dx + 0.4, dy + 0.55, 0.88), M["walnut"], bevel=0.004, rot=(0, R(-10), R(-20)))
    # task chair
    cx = dx - 0.85
    ch = empty("desk_chair", (cx, dy, 0))
    cushion("desk_chair_seat", (0.52, 0.52, 0.09), (cx, dy, 0.48), M["leather"], puff=0.4, parent=ch)
    cushion("desk_chair_back", (0.07, 0.5, 0.5), (cx - 0.28, dy, 0.82), M["leather"], puff=0.4, rot=(0, R(10), 0), parent=ch)
    cylinder("desk_chair_post", 0.03, 0.42, (cx, dy, 0.24), M["chrome"], segs=16, parent=ch)
    for k in range(5):
        a = k * 2 * math.pi / 5
        box(f"desk_chair_leg_{k}", (0.3, 0.04, 0.03), (cx + 0.15 * math.cos(a), dy + 0.15 * math.sin(a), 0.05), M["chrome"],
            rot=(0, 0, a), parent=ch)
    add_collider(cx - 0.32, dy - 0.32, cx + 0.32, dy + 0.32)
    # bookcases on the north wall and the west wall
    bookcase(M, "study_books_n", STUDY_X + WT / 2 + 0.1, STUDY_Y - WT / 2, XE - STUDY_X - 0.35, "x", -1, seed=11)
    bookcase(M, "study_books_w", STUDY_X + WT / 2, YS + 0.4, 5.1, "y", 1, seed=12)
    # file credenza under the east window with binders and archive boxes
    fx = XE - 0.3
    box("file_credenza", (0.48, 2.4, 0.72), (fx, -8.3, 0.36), material("file_greige", color=(0.58, 0.55, 0.5), rough=0.5),
        bevel=0.005)
    for k in range(4):
        box(f"file_gap_{k}", (0.004, 0.56, 0.004), (fx - 0.242, -9.2 + k * 0.6, 0.36), M["blackmetal"])
    add_collider(fx - 0.26, -9.55, XE, -7.05)
    for k in range(10):
        box(f"binder_{k}", (0.28, 0.06, 0.32), (fx, -9.35 + k * 0.07, 0.88), [M["book4"], M["book1"], M["paper"]][k % 3],
            bevel=0.003)
    for k in range(3):
        box(f"archive_box_{k}", (0.36, 0.3, 0.26), (fx, -7.9 + k * 0.33 - 0.3, 0.86), M["envelope"], bevel=0.004)
    build_travel_wall(M)
    # reading corner
    armchair(M, "study_reading_chair", 10.1, -1.5, -150, M["leather"])
    cylinder("study_lamp_base", 0.15, 0.03, (10.6, -1.05, 0.015), M["blackmetal"], segs=32)
    cylinder("study_lamp_pole", 0.012, 1.45, (10.6, -1.05, 0.74), M["brass"], segs=12)
    s = cylinder("study_lamp_shade", 0.2, 0.3, (10.6, -1.05, 1.55), M["shade"], r2=0.17, segs=40)
    s["lamp_group"] = "study_lamp"
    interact(s, "lamp", "閱讀燈", light="study_lamp")
    A.point_light("study_lamp", (10.6, -1.05, 1.5), 35, (1.0, 0.72, 0.45), 0.1)
    A.plant("plant_study", (6.75, -1.2), M, 1.6)


def build_travel_wall(M):
    """World map with our routes, a credenza of travel journals, suitcase, globe, passports."""
    wy = YS + 0.07
    mx = 8.6
    m = box("travel_map", (3.4, 0.01, 1.7), (mx, wy + 0.03, 1.85), M["map"])
    m["uvfit"] = "-xz"
    interact(m, "travel", "旅行地圖 · 我們的行程")
    frame = [((3.5, 0.04, 0.05), (mx, wy + 0.02, 2.72)), ((3.5, 0.04, 0.05), (mx, wy + 0.02, 0.98)),
             ((0.05, 0.04, 1.8), (mx - 1.73, wy + 0.02, 1.85)), ((0.05, 0.04, 1.8), (mx + 1.73, wy + 0.02, 1.85))]
    multi_box("travel_map_frame", frame, M["walnut"], bevel=0.006)
    box("travel_credenza", (2.8, 0.46, 0.7), (mx, wy + 0.24, 0.38), M["walnut"], bevel=0.006)
    for dx_ in (-1.35, 1.35):
        box(f"travel_credenza_leg_{dx_}", (0.04, 0.42, 0.04), (mx + dx_, wy + 0.24, 0.02), M["brass"])
    add_collider(mx - 1.42, wy, mx + 1.42, wy + 0.5)
    j = empty("travel_journals", (mx - 0.6, wy + 0.25, 0.74))
    cols = [M["leather_tan"], M["book1"], M["book3"], M["leather"], M["book5"]]
    for k in range(5):
        box(f"journal_{k}", (0.18, 0.24, 0.03), (mx - 0.6 + 0.01 * (k % 2), wy + 0.25, 0.75 + k * 0.032), cols[k],
            bevel=0.004, rot=(0, 0, R(-6 + 4 * k)), parent=j)
    interact(j, "travel", "旅行日記")
    box("travel_suitcase", (0.55, 0.22, 0.38), (mx + 0.55, wy + 0.25, 0.92), M["leather_tan"], bevel=0.03)
    for dx_ in (-0.18, 0.18):
        box(f"suitcase_strap_{dx_}", (0.03, 0.225, 0.385), (mx + 0.55 + dx_, wy + 0.25, 0.92), M["leather"])
    tube("suitcase_handle", [(mx + 0.47, wy + 0.25, 1.11), (mx + 0.5, wy + 0.25, 1.16), (mx + 0.6, wy + 0.25, 1.16),
                             (mx + 0.63, wy + 0.25, 1.11)], 0.008, M["leather"])
    cylinder("globe_stand", 0.08, 0.02, (mx + 1.15, wy + 0.25, 0.74), M["brass"], segs=32)
    tube("globe_arc", [(mx + 1.15 + 0.15 * math.sin(a / 10 * math.pi), wy + 0.25, 0.92 - 0.15 * math.cos(a / 10 * math.pi))
                       for a in range(11)], 0.005, M["brass"])
    sphere("globe", 0.14, (mx + 1.15, wy + 0.25, 0.92), material("globe_sea", color=(0.32, 0.45, 0.48), rough=0.4,
                                                                  coat=0.6), segs=32)
    for k in range(2):
        box(f"passport_{k}", (0.09, 0.125, 0.008), (mx - 0.1 + k * 0.03, wy + 0.25, 0.735 + k * 0.009),
            material("passport", color=(0.35, 0.05, 0.08), rough=0.6), rot=(0, 0, R(10 * k)))
    A.spot("travel_spot", (mx, wy + 1.0, H - 0.05), 30, angle=60)


# ---------------------------------------------------------------------------
def garment(name, kind, x, y, top, mat, M, parent=None, turn=0.0):
    """Hanging garment built from a deformed subdivided block (+ hanger). Broad face in the XZ plane."""
    spec = {  # length, thickness, [(t, half width)], sleeves
        "jacket": (0.76, 0.06, [(0, 0.22), (0.5, 0.19), (0.88, 0.22), (1, 0.21)], True),
        "shirt": (0.8, 0.04, [(0, 0.21), (0.6, 0.2), (0.9, 0.22), (1, 0.2)], True),
        "coat": (1.12, 0.07, [(0, 0.28), (0.55, 0.22), (0.9, 0.24), (1, 0.22)], True),
        "dress": (1.32, 0.05, [(0, 0.34), (0.55, 0.16), (0.72, 0.14), (0.9, 0.17), (1, 0.15)], False),
        "cocktail": (0.98, 0.05, [(0, 0.26), (0.5, 0.15), (0.72, 0.14), (0.9, 0.17), (1, 0.15)], False),
        "pants": (0.6, 0.04, [(0, 0.18), (1, 0.19)], False),
    }[kind]
    length, thick, prof, sleeves = spec
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=9, use_grid_fill=True)
    def hw(t):
        for (t0, w0), (t1, w1) in zip(prof[:-1], prof[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0)
                return w0 + (w1 - w0) * (k * k * (3 - 2 * k))
        return prof[-1][1]
    for v in bm.verts:
        t = v.co.z + 0.5
        w = hw(t)
        v.co.x *= 2 * w
        v.co.y *= thick * (0.6 + 0.4 * (1 - abs(v.co.x) / max(w, 1e-3)))
        v.co.z = top - 0.06 - (1 - t) * length
        if t > 0.9:   # sloping shoulders
            v.co.z -= abs(v.co.x) * 0.35 * (t - 0.9) / 0.1
    bmesh.ops.translate(bm, vec=(x, y, 0), verts=bm.verts)
    if turn:
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(x, y, 0), matrix=Matrix.Rotation(turn, 3, "Z"))
    ob = lib._finish(name, bm, mat, group="suite", parent=parent, angle=70)
    if sleeves:
        for s_ in (-1, 1):
            sx, sy = x + s_ * (prof[-2][1] - 0.01) * math.cos(turn), y + s_ * (prof[-2][1] - 0.01) * math.sin(turn)
            tube(f"{name}_sleeve_{s_}", [(sx, sy, top - 0.1), (sx + s_ * 0.02 * math.cos(turn), sy, top - 0.1 - length * 0.75)],
                 0.035, mat, parent=parent, group="suite")
    hx, hy = x, y
    dxh, dyh = 0.2 * math.cos(turn), 0.2 * math.sin(turn)
    tube(f"{name}_hanger", [(hx - dxh, hy - dyh, top - 0.07), (hx, hy, top - 0.02), (hx + dxh, hy + dyh, top - 0.07)],
         0.006, M["walnut"], parent=parent, group="suite")
    tube(f"{name}_hook", [(hx, hy, top - 0.02), (hx, hy, top + 0.03)], 0.003, M["brass"], parent=parent, group="suite")
    return ob


def wardrobe_run(M, name, axis, line, a0, a1, facing, garments, boxes, label, glass=True, depth=0.62, height=2.9):
    """Built-in wardrobe along a wall with hinged glass doors, a hanging rail of garments,
    top shelf with couture boxes. axis='y': along y at x=line, opening towards +x if facing=1."""
    L = a1 - a0
    def P(sz, along, across, z):
        if axis == "y":
            return ((sz[1], sz[0], sz[2]), (line + facing * across, a0 + along, z))
        return ((sz[0], sz[1], sz[2]), (a0 + along, line + facing * across, z))
    parts = [P((L, depth, 0.04), L / 2, depth / 2, 0.02), P((L, depth, 0.04), L / 2, depth / 2, height - 0.02),
             P((L, depth, 0.03), L / 2, depth / 2, 2.32), P((L, 0.02, height), L / 2, 0.01, height / 2)]
    nd = max(2, round(L / 0.55))
    dw = L / nd
    for i in range(nd // 2 + 1):
        parts.append(P((0.03, depth, height), min(L - 0.015, i * 2 * dw), depth / 2, height / 2))
    multi_box(f"{name}_carcass", parts, M["walnut"], bevel=0.003, group="suite")
    leds = [P((L - 0.1, 0.03, 0.008), L / 2, depth - 0.08, 2.29)]
    multi_box(f"{name}_led", leds, M["ledstrip"], group=None)
    c = P((L, depth, 0), L / 2, depth / 2, 2.25)[1]
    A.area_light(f"{name}_led", c, ((0.1, L - 0.2) if axis == "y" else (L - 0.2, 0.1)), 30, (1.0, 0.86, 0.68))
    rail = [P((0, 0, 0), 0.05, depth * 0.5, 2.2)[1], P((0, 0, 0), L - 0.05, depth * 0.5, 2.2)[1]]
    tube(f"{name}_rail", rail, 0.012, M["brass"], group="suite")
    # garments spaced along the rail
    n = len(garments)
    for i, (kind, gm) in enumerate(garments):
        along = 0.15 + (L - 0.3) * (i + 0.5) / n
        gx, gy, _ = P((0, 0, 0), along, depth * 0.5, 0)[1]
        garment(f"{name}_g{i}", kind, gx, gy, 2.2, M[gm], M, turn=(0 if axis == "y" else math.pi / 2))
    # couture boxes on the top shelf
    for i, b in enumerate(boxes):
        along = 0.25 + (L - 0.5) * (i + 0.5) / len(boxes)
        sz = (0.42, 0.34, 0.22) if i % 2 else (0.36, 0.3, 0.16)
        bx = box(f"{name}_box{i}", P(sz, along, depth * 0.45, 2.34 + sz[2] / 2)[0], P(sz, along, depth * 0.45, 2.34 + sz[2] / 2)[1],
                 M[f"brand_{b}"], bevel=0.004, group="suite")
        bx["uvfit"] = ("-yz" if facing > 0 else "yz") if axis == "y" else ("xz" if facing > 0 else "-xz")
    # glass doors (pairs), each interactive
    for i in range(nd):
        hinge_along = i * dw if i % 2 == 0 else (i + 1) * dw
        hp = P((0, 0, 0), hinge_along, depth + 0.005, 0)[1]
        h = empty(f"{name}_door_{i}", hp)
        mid = hinge_along + (dw / 2 if i % 2 == 0 else -dw / 2)
        sz, ctr = P((dw - 0.01, 0.022, height - 0.08), mid, depth + 0.012, height / 2)
        g = box(f"{name}_door_{i}_glass", sz, ctr, M["glass_frost"] if not glass else M["rail_glass"], group=None, parent=h)
        g["glass"] = 1
        fr = []
        for z in (0.06, height - 0.06):
            fr.append(P((dw - 0.01, 0.03, 0.03), mid, depth + 0.012, z))
        for e in (mid - (dw - 0.02) / 2, mid + (dw - 0.02) / 2):
            fr.append(P((0.03, 0.03, height - 0.1), e, depth + 0.012, height / 2))
        multi_box(f"{name}_door_{i}_frame", fr, M["bronze"], parent=h, group="suite")
        pull_along = mid + (dw / 2 - 0.06) * (1 if i % 2 == 0 else -1)
        ps, pc = P((0.015, 0.03, 0.5), pull_along, depth + 0.035, 1.3)
        box(f"{name}_door_{i}_pull", ps, pc, M["brass"], parent=h, group="suite")
        ang = 95 if i % 2 == 0 else -95
        if (axis == "y" and facing < 0) or (axis == "x" and facing > 0):
            ang = -ang
        interact(h, "door", label, angle=ang)
    if axis == "y":
        add_collider(min(line, line + facing * (depth + 0.05)), a0, max(line, line + facing * (depth + 0.05)), a1)
    else:
        add_collider(a0, min(line, line + facing * (depth + 0.05)), a1, max(line, line + facing * (depth + 0.05)))


def bag(name, x, y, z, mat, M, kind="birkin", turn=0.0):
    if kind == "birkin":
        b = box(f"{name}_body", (0.32, 0.17, 0.24), (x, y, z + 0.12), mat, bevel=0.03, group="suite", rot=(0, 0, turn))
        box(f"{name}_flap", (0.33, 0.175, 0.06), (x, y, z + 0.22), mat, bevel=0.02, group="suite", rot=(0, 0, turn))
        for s_ in (-1, 1):
            tube(f"{name}_handle_{s_}", [(x - 0.07, y + s_ * 0.03, z + 0.24), (x - 0.05, y + s_ * 0.03, z + 0.34),
                                         (x + 0.05, y + s_ * 0.03, z + 0.34), (x + 0.07, y + s_ * 0.03, z + 0.24)],
                 0.008, mat, group="suite")
        box(f"{name}_lock", (0.03, 0.18, 0.03), (x, y, z + 0.2), M["gold"], bevel=0.005, group="suite")
    else:  # quilted flap bag on a chain
        box(f"{name}_body", (0.26, 0.08, 0.16), (x, y, z + 0.08), mat, bevel=0.02, group="suite")
        box(f"{name}_turnlock", (0.03, 0.085, 0.02), (x, y, z + 0.12), M["gold"], bevel=0.004, group="suite")
        tube(f"{name}_chain", [(x - 0.1, y, z + 0.16), (x - 0.06, y, z + 0.3), (x + 0.06, y, z + 0.3), (x + 0.1, y, z + 0.16)],
             0.004, M["gold"], group="suite")
    return b if kind == "birkin" else None


def build_closet(M):
    """Open walk-in closet: his wardrobe (west), hers (south), bags & shoes display (north), island."""
    xw = XW
    his = [("jacket", "wool_navy"), ("jacket", "wool_char"), ("jacket", "wool_navy"), ("shirt", "shirt_white"),
           ("shirt", "shirt_white"), ("shirt", "shirt_blue"), ("shirt", "shirt_blue"), ("coat", "wool_camel"),
           ("coat", "wool_char"), ("pants", "wool_navy"), ("pants", "wool_char"), ("jacket", "silk_black")]
    wardrobe_run(M, "his_wardrobe", "y", xw, CLOSET_Y + 0.2, BATH_Y - 0.25, 1, his, ["tomford", "loropiana", "tomford",
                                                                                      "loropiana", "hermes"], "衣櫃 · 他的")
    hers = [("dress", "silk_black"), ("dress", "silk_champagne"), ("cocktail", "silk_red"), ("dress", "silk_emerald"),
            ("cocktail", "silk_blush"), ("jacket", "tweed"), ("jacket", "tweed"), ("coat", "trench"),
            ("shirt", "silk_ivory"), ("cocktail", "silk_black"), ("dress", "silk_ivory"), ("coat", "wool_camel"),
            ("shirt", "silk_blush")]
    wardrobe_run(M, "her_wardrobe", "x", CLOSET_Y + WT / 2, xw + 0.65, CLOSET_X - 0.35, 1, hers,
                 ["chanel", "dior", "hermes", "chanel", "dior", "hermes"], "衣櫃 · 她的")
    # bags & shoes display on the bathroom wall, open lit shelves
    wy = BATH_Y - WT / 2
    a0, a1 = xw + 0.65, CLOSET_X - 0.35
    L = a1 - a0
    parts = [((L, 0.4, 0.03), ((a0 + a1) / 2, wy - 0.2, z)) for z in (0.12, 0.45, 0.9, 1.4, 1.9, 2.4)]
    parts += [((0.03, 0.4, 2.5), (a0 + i * L / 4, wy - 0.2, 1.25)) for i in range(5)]
    parts.append(((L, 0.015, 2.6), ((a0 + a1) / 2, wy - 0.01, 1.3)))
    multi_box("display_case", parts, M["walnut"], bevel=0.003, group="suite")
    multi_box("display_leds", [((L - 0.1, 0.02, 0.006), ((a0 + a1) / 2, wy - 0.35, z - 0.02)) for z in (0.9, 1.4, 1.9, 2.4)],
              M["ledstrip"], group=None)
    A.area_light("display_led", ((a0 + a1) / 2, wy - 0.3, 1.5), (L - 0.2, 0.2), 30, (1.0, 0.86, 0.68), rot=(R(-30), 0, 0))
    add_collider(a0, wy - 0.42, a1, wy)
    bagmats = ["bag_orange", "bag_black", "bag_etoupe", "bag_orange", "bag_black", "leather_tan", "bag_etoupe", "bag_black"]
    for i in range(8):
        bx = a0 + L * (i % 4 + 0.5) / 4
        z = 1.415 if i < 4 else 1.915
        bag(f"bag_{i}", bx, wy - 0.2, z, M[bagmats[i]], M, kind="birkin" if i % 3 != 1 else "flap")
    for i in range(4):  # hat / shoe boxes on the top shelf
        bx_ = box(f"display_box_{i}", (0.4, 0.3, 0.26), (a0 + L * (i + 0.5) / 4, wy - 0.2, 2.545),
                  M[f"brand_{['hermes', 'chanel', 'dior', 'cartier'][i]}"], bevel=0.004, group="suite")
        bx_["uvfit"] = "xz"
    shoes = [(0.03, 0.03, 0.03), (0.6, 0.05, 0.06), (0.86, 0.75, 0.62), (0.05, 0.05, 0.05), (0.42, 0.24, 0.12),
             (0.9, 0.88, 0.86), (0.25, 0.08, 0.06), (0.03, 0.03, 0.03)]
    for i, col in enumerate(shoes):
        m_ = material(f"shoe_c{i}", color=col, rough=0.35, coat=0.4)
        for row, z in enumerate((0.135, 0.465, 0.915)):
            if row == 2 and i > 3:
                continue
            for s_ in (-1, 1):
                sx = a0 + L * (i + 0.5) / 8 + s_ * 0.05
                if row == 0:   # his loafers
                    cushion(f"shoe_{i}_{row}_{s_}", (0.09, 0.28, 0.08), (sx, wy - 0.2, z + 0.045), m_, puff=0.45, group="suite")
                else:          # her heels
                    cushion(f"shoe_{i}_{row}_{s_}", (0.07, 0.22, 0.05), (sx, wy - 0.17, z + 0.07), m_, puff=0.45,
                            rot=(R(-18), 0, 0), group="suite")
                    cylinder(f"heel_{i}_{row}_{s_}", 0.006, 0.08, (sx, wy - 0.28, z + 0.04), m_, segs=8, group="suite")
    # island: walnut with a glass top over velvet trays of watches and jewellery
    ix, iy = -12.3, -1.3
    box("island_closet", (2.0, 0.95, 0.88), (ix, iy, 0.44), M["walnut"], bevel=0.006)
    box("island_closet_tray", (1.9, 0.85, 0.01), (ix, iy, 0.865), M["velvet_tray"])
    g = box("island_closet_glass", (2.0, 0.95, 0.012), (ix, iy, 0.9), M["glass"], group=None)
    g["glass"] = 1
    for k in range(6):  # watches
        wx = ix - 0.8 + k * 0.17
        cylinder(f"watch_{k}", 0.022, 0.01, (wx, iy - 0.2, 0.876), M["gold"] if k % 2 else M["chrome"], segs=24)
        cylinder(f"watch_face_{k}", 0.019, 0.002, (wx, iy - 0.2, 0.882), M["satin"] if k % 3 else M["tvscreen"], segs=24)
        box(f"watch_band_{k}", (0.02, 0.18, 0.004), (wx, iy - 0.2, 0.872), M["leather"] if k % 2 else M["chrome"])
    for k in range(5):  # rings and a necklace
        tube(f"ring_{k}", [(ix + 0.2 + k * 0.12 + 0.01 * math.cos(a * math.pi / 6), iy + 0.15 + 0.01 * math.sin(a * math.pi / 6), 0.875)
                          for a in range(13)], 0.002, M["gold"])
    tube("necklace", [(ix - 0.3 + 0.15 * math.cos(a * math.pi / 12), iy + 0.15 + 0.1 * math.sin(a * math.pi / 12), 0.872)
                      for a in range(25)], 0.0025, M["gold"])
    for k in range(3):
        bx_ = box(f"cartier_box_{k}", (0.12, 0.12, 0.07), (ix + 0.6 + k * 0.15, iy - 0.25, 0.94), M["brand_cartier"],
                  bevel=0.01, rot=(0, 0, R(10 * k)))
        bx_["uvfit"] = "xy"
    cylinder("closet_vase", 0.07, 0.3, (ix - 0.75, iy + 0.25, 1.06), M["ceramic"], r2=0.05, segs=32)
    for k in range(7):
        sphere(f"closet_peony_{k}", 0.045, (ix - 0.75 + 0.05 * math.cos(k), iy + 0.25 + 0.05 * math.sin(k), 1.25 + 0.03 * (k % 2)),
               material("peony", color=(0.95, 0.75, 0.78), rough=0.6, sheen=0.5), segs=12)
    add_collider(ix - 1.02, iy - 0.5, ix + 1.02, iy + 0.5)
    # full-length mirror + ottoman
    m = box("closet_mirror", (0.04, 0.9, 1.95), (CLOSET_X - 0.4, -2.6, 1.05), M["mirror"], rot=(0, R(-4), R(30)))
    box("closet_mirror_frame", (0.05, 0.96, 2.02), (CLOSET_X - 0.38, -2.6, 1.05), M["brass"], rot=(0, R(-4), R(30)))
    del m
    add_collider(CLOSET_X - 0.75, -3.1, CLOSET_X - 0.05, -2.1)
    cushion("closet_ottoman", (0.7, 0.7, 0.42), (-11.0, 0.0, 0.21), M["velvet"], puff=0.4)
    add_collider(-11.35, -0.35, -10.65, 0.35)
    A.pendant_globe("closet_pendant", (-12.3, -1.3, 2.3), M)


# ---------------------------------------------------------------------------
def bed_group(M):
    """King bed built facing +X with its headboard at x=0 (placed later)."""
    bx, by = 1.1, 0.0
    rug = extrude_poly("rug_bed", rounded_rect(3.6, 3.8, 0.08), 0.016, (1.6, 0.0, 0.0), M["rug2"])
    rug["uvfit"] = 1
    bed = empty("bed", (bx, by, 0))
    box("bed_plinth", (2.1, 1.84, 0.1), (bx, by, 0.06), M["blackmetal"])
    cushion("bed_base", (2.2, 2.0, 0.32), (bx, by, 0.28), M["velvet"], puff=0.18, parent=bed)
    cushion("bed_headboard", (0.18, 2.6, 1.3), (0.09, by, 0.85), M["velvet"], puff=0.22, parent=bed)
    for i, dy in enumerate((-0.86, -0.29, 0.29, 0.86)):
        cushion(f"bed_head_panel_{i}", (0.1, 0.55, 1.0), (0.2, by + dy, 1.05), M["velvet"], puff=0.45, parent=bed)
    cushion("bed_mattress", (2.05, 1.92, 0.26), (bx + 0.02, by, 0.55), M["mattress"], puff=0.18, parent=bed)
    cushion("bed_duvet", (1.6, 2.05, 0.16), (bx + 0.32, by, 0.72), M["duvet"], puff=0.45, parent=bed)
    cushion("bed_duvet_fold", (0.3, 2.06, 0.1), (bx - 0.45, by, 0.78), M["duvet"], puff=0.45, parent=bed)
    cushion("bed_throw", (0.55, 2.1, 0.06), (bx + 0.85, by, 0.82), M["linen"], puff=0.45, parent=bed)
    for i, dy in enumerate((-0.48, 0.48)):
        cushion(f"bed_pillow_{i}", (0.22, 0.75, 0.44), (0.45, by + dy, 0.88), M["duvet"], puff=0.48, rot=(0, R(-22), 0), parent=bed)
        cushion(f"bed_pillow_front_{i}", (0.16, 0.6, 0.38), (0.6, by + dy, 0.86), M["linen"], puff=0.48, rot=(0, R(-18), 0), parent=bed)
    cushion("bed_bolster", (0.2, 0.9, 0.26), (0.78, by, 0.83), M["velvet"], puff=0.48, parent=bed)
    add_collider(0, by - 1.05, bx + 1.12, by + 1.05)
    gx = bx + 1.55
    cushion("bed_bench_pad", (0.46, 1.6, 0.12), (gx, by, 0.46), M["leather"], puff=0.4)
    for dy in (-0.7, 0.7):
        box(f"bed_bench_leg_{dy}", (0.44, 0.04, 0.4), (gx, by + dy, 0.2), M["brass"])
    add_collider(gx - 0.24, by - 0.82, gx + 0.24, by + 0.82)
    gy, gz = by + 0.35, 0.62
    box("gift_body", (0.3, 0.3, 0.2), (gx, gy, gz), M["gift"], bevel=0.004)
    multi_box("gift_ribbon_body", [((0.302, 0.04, 0.202), (gx, gy, gz)), ((0.04, 0.302, 0.202), (gx, gy, gz))], M["ribbon"])
    lid = empty("gift_lid", (gx, gy - 0.15, gz + 0.1))
    box("gift_lid_box", (0.32, 0.32, 0.05), (gx, gy, gz + 0.12), M["gift"], bevel=0.006, parent=lid)
    multi_box("gift_lid_ribbon", [((0.322, 0.04, 0.052), (gx, gy, gz + 0.12)), ((0.04, 0.322, 0.052), (gx, gy, gz + 0.12))],
              M["ribbon"], parent=lid)
    for i, a in enumerate((R(30), R(-30))):
        sphere(f"gift_bow_{i}", 0.06, (gx + 0.1 * math.sin(a), gy, gz + 0.18), M["ribbon"], scale=(1, 0.45, 0.6),
               rot=(0, a, 0), parent=lid)
    heart = sphere("gift_heart", 0.05, (gx, gy, gz + 0.07), material("heart", color=(0.9, 0.1, 0.18), rough=0.25, coat=1.0,
                                                                        emission=(1, 0.2, 0.3), emission_strength=0.0))
    heart["gift_heart"] = 1
    interact(lid, "gift", "禮物盒", angle=110)
    for i, y in enumerate((by - 1.42, by + 1.42)):
        box(f"nightstand_{i}", (0.5, 0.55, 0.55), (0.3, y, 0.3), M["walnut"], bevel=0.01)
        box(f"nightstand_{i}_gap", (0.004, 0.48, 0.004), (0.552, y, 0.4), M["blackmetal"])
        box(f"nightstand_{i}_pull", (0.015, 0.12, 0.012), (0.56, y, 0.48), M["brass"])
        add_collider(0, y - 0.28, 0.56, y + 0.28)
        cylinder(f"bed_lamp_{i}_base", 0.07, 0.32, (0.28, y, 0.74), M["ceramic"], r2=0.05, segs=32)
        s = cylinder(f"bed_lamp_{i}_shade", 0.17, 0.22, (0.28, y, 1.01), M["shade"], r2=0.13, segs=40)
        interact(s, "lamp", "床頭燈", light=f"bed_lamp_{i}")
        s["lamp_group"] = f"bed_lamp_{i}"
        A.point_light(f"bed_lamp_{i}", (0.28, y, 0.98), 30, (1.0, 0.72, 0.45), 0.08)
    box("bed_art", (0.04, 2.2, 0.8), (0.02, by, 2.3), M["linen"], bevel=0.01)


def build_bedroom(M):
    # headboard on the kitchen wall, bed facing the west glazing; three sides free
    placed(bed_group, M, rot=180, loc=(SUITE_X - WT / 2, -6.75), name="bed_group")
    # keepsake vitrine on the south wall, letter wall on the closet wall
    placed(A.build_vitrine, M, rot=-90, loc=(-11.5 - 2.4, YS + 0.07 - 1.27), name="vitrine_group")
    placed(A.build_letter_wall, M, 0.0, rot=180, loc=(-12.4 - 3.35, CLOSET_Y - WT / 2), name="letter_group")
    armchair(M, "bed_lounge_a", -13.9, -8.6, -60, M["boucle"])
    armchair(M, "bed_lounge_b", -13.9, -5.0, -120, M["boucle"])
    cylinder("bed_lounge_table", 0.28, 0.03, (-14.1, -6.8, 0.5), M["darkmarble"], segs=40, bevel=0.006)
    cylinder("bed_lounge_stem", 0.03, 0.5, (-14.1, -6.8, 0.25), M["brass"], segs=16)
    add_collider(-14.4, -7.1, -13.8, -6.5)
    A.plant("plant_bed", (-9.6, -9.5), M, 1.8)
    # vestibule console with flowers
    box("vest_console", (0.4, 1.4, 0.05), (SUITE_X - WT / 2 - 0.22, -2.6, 0.82), M["walnut"], bevel=0.01)
    for dy in (-0.65, 0.65):
        box(f"vest_console_leg_{dy}", (0.36, 0.03, 0.8), (SUITE_X - WT / 2 - 0.22, -2.6 + dy, 0.4), M["brass"])
    add_collider(SUITE_X - WT / 2 - 0.45, -3.35, SUITE_X - WT / 2, -1.85)
    cylinder("vest_vase", 0.08, 0.34, (SUITE_X - 0.3, -2.4, 1.02), M["ceramic"], r2=0.04, segs=32)
    A.pendant_globe("vest_pendant", (-7.9, -1.2, 2.35), M)


# ---------------------------------------------------------------------------
def bathtub(name, cx, cy, L, W, Ht, mat):
    """Freestanding oval tub: outer shell tapering to the floor, rolled rim, inner basin."""
    bm = bmesh.new()
    n = 48
    def ring(rx, ry, z):
        return [bm.verts.new((cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n), z))
                for i in range(n)]
    rings = [ring(L * 0.4, W * 0.38, 0.0), ring(L * 0.44, W * 0.43, 0.06), ring(L * 0.49, W * 0.48, Ht * 0.6),
             ring(L * 0.5, W * 0.5, Ht - 0.02), ring(L * 0.49, W * 0.49, Ht), ring(L * 0.45, W * 0.43, Ht - 0.01),
             ring(L * 0.43, W * 0.4, Ht - 0.15), ring(L * 0.38, W * 0.32, 0.14), ring(L * 0.3, W * 0.24, 0.1)]
    for a, b in zip(rings[:-1], rings[1:]):
        for i in range(n):
            bm.faces.new([a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]])
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return lib._finish(name, bm, mat, group="suite", angle=60)


def build_bathroom(M):
    # marble wall cladding inside the bathroom
    cl = [((abs(SUITE_X - WT / 2 - XW), 0.02, H), ((XW + SUITE_X) / 2, BATH_Y + WT / 2 + 0.011, H / 2)),
          ((0.02, YN - BATH_Y - 0.5, H), (SUITE_X - WT / 2 - 0.011, (BATH_Y + YN) / 2, H / 2))]
    multi_box("bath_cladding", cl, M["bath_stone"], group="arch")
    # freestanding tub at the window
    tx, ty = -10.6, 5.6
    tub = bathtub("bathtub", tx, ty, 1.8, 0.85, 0.6, M["porcelain"])
    water = extrude_poly("bath_water", [(tx + 0.75 * math.cos(2 * math.pi * i / 40), ty + 0.32 * math.sin(2 * math.pi * i / 40))
                                        for i in range(40)], 0.005, (0, 0, 0.42), M["water"], group=None)
    water["bathwater"] = 1
    interact(tub, "bath", "浴缸 · 放水")
    add_collider(tx - 0.95, ty - 0.48, tx + 0.95, ty + 0.48)
    fx = tx - 1.15
    tube("tub_filler", [(fx, ty, 0.0), (fx, ty, 0.95), (fx + 0.08, ty, 1.02), (fx + 0.22, ty, 0.98)], 0.018, M["brass"])
    empty("tub_spout", (fx + 0.22, ty, 0.95))
    box("tub_tray", (0.22, 0.95, 0.025), (tx + 0.2, ty, 0.62), M["walnut"], bevel=0.006)
    cylinder("tub_candle", 0.04, 0.08, (tx + 0.2, ty - 0.25, 0.672), M["ceramic"], segs=24)
    box("tub_book", (0.15, 0.2, 0.02), (tx + 0.2, ty + 0.2, 0.643), M["book3"], bevel=0.003)
    cushion("tub_towel", (0.35, 0.5, 0.1), (tx + 1.3, ty - 0.3, 0.5), M["towel"], puff=0.45)
    cylinder("tub_stool", 0.2, 0.45, (tx + 1.3, ty - 0.3, 0.225), M["walnut"], segs=32)
    A.pendant_globe("tub_pendant", (tx, ty, 2.4), M)
    # double vanity on the bathroom side of the closet wall
    vy = BATH_Y + WT / 2
    v0, v1 = -14.6, -11.2
    box("vanity_cabinet", (v1 - v0, 0.55, 0.5), ((v0 + v1) / 2, vy + 0.28, 0.6), M["walnut"], bevel=0.006)
    box("vanity_top", (v1 - v0 + 0.04, 0.58, 0.04), ((v0 + v1) / 2, vy + 0.29, 0.87), M["marble"], bevel=0.004)
    add_collider(v0, vy, v1, vy + 0.6)
    for k, x in enumerate((v0 + 0.9, v1 - 0.9)):
        sphere(f"basin_{k}", 0.22, (x, vy + 0.32, 0.9), M["porcelain"], scale=(1, 0.8, 0.35))
        f = empty(f"vanity_faucet_{k}", (x, vy + 0.03, 1.15))
        tube(f"vanity_spout_{k}", [(x, vy + 0.01, 1.15), (x, vy + 0.16, 1.15), (x, vy + 0.18, 1.12)], 0.012, M["brass"], parent=f)
        empty(f"vanity_spout_tip_{k}", (x, vy + 0.18, 1.1), parent=f)
        interact(bpy.data.objects[f"vanity_spout_{k}"], "faucet", "水龍頭", spout=f"vanity_spout_tip_{k}")
        cylinder(f"vanity_mirror_{k}", 0.42, 0.02, (x, vy + 0.012, 1.75), M["mirror"], segs=64, rot=(R(90), 0, 0))
        cylinder(f"vanity_halo_{k}", 0.44, 0.012, (x, vy + 0.004, 1.75), M["halo"], segs=64, rot=(R(90), 0, 0), group=None)
        A.area_light(f"vanity_halo_{k}", (x, vy + 0.3, 1.75), (0.6, 0.6), 12, (1.0, 0.88, 0.7), rot=(R(-90), 0, 0))
        cylinder(f"soap_{k}", 0.035, 0.14, (x + 0.35, vy + 0.15, 0.96), material("amber_glass", color=(0.5, 0.25, 0.08),
                                                                                    rough=0.1, coat=1.0), segs=20)
    # walk-in shower behind a glass screen
    sx = -12.9
    g = box("shower_glass", (0.012, 3.0, 2.2), (sx, 4.9, 1.12), M["rail_glass"], group=None)
    g["glass"] = 1
    box("shower_glass_rail", (0.03, 3.0, 0.03), (sx, 4.9, 2.24), M["brass"])
    add_collider(sx - 0.03, 3.4, sx + 0.03, 6.4)
    cylinder("rain_head", 0.17, 0.012, (-14.0, 5.0, 2.4), M["brass"], segs=48)
    tube("rain_arm", [(XW + 0.03, 5.0, 2.55), (-14.0, 5.0, 2.55), (-14.0, 5.0, 2.41)], 0.012, M["brass"])
    cylinder("shower_mixer", 0.05, 0.03, (XW + 0.03, 4.0, 1.1), M["brass"], segs=24, rot=(0, R(90), 0))
    box("shower_drain", (0.05, 2.6, 0.003), (sx - 0.2, 4.9, 0.002), M["brass"])
    box("shower_bench", (0.4, 1.4, 0.45), (XW + 0.22, 4.9, 0.225), M["bath_stone"], bevel=0.01)
    # WC behind frosted glass in the corner by the doors
    wcx0, wcy0 = -8.1, 4.9
    gw = box("wc_glass_w", (0.02, YN - 0.2 - wcy0, 2.2), (wcx0, (wcy0 + YN - 0.2) / 2, 1.1), M["glass_frost"], group=None)
    gw["glass"] = 1
    gs = box("wc_glass_s", (SUITE_X - WT / 2 - wcx0 - 0.8, 0.02, 2.2), (wcx0 + (SUITE_X - WT / 2 - wcx0 - 0.8) / 2, wcy0, 1.1),
             M["glass_frost"], group=None)
    gs["glass"] = 1
    add_collider(wcx0 - 0.03, wcy0, wcx0 + 0.03, YN - 0.2)
    add_collider(wcx0, wcy0 - 0.03, wcx0 + 1.1, wcy0 + 0.03)
    box("wc_cistern", (0.18, 0.5, 0.9), (SUITE_X - WT / 2 - 0.1, 6.0, 0.6), M["bath_stone"])
    cushion("wc_bowl", (0.55, 0.38, 0.32), (SUITE_X - WT / 2 - 0.45, 6.0, 0.4), M["porcelain"], puff=0.45)
    box("wc_flush", (0.01, 0.2, 0.12), (SUITE_X - WT / 2 - 0.191, 6.0, 1.1), M["brass"])
    add_collider(SUITE_X - 0.8, 5.7, SUITE_X, 6.3)
    # towel ladder + plant
    for z in (0.4, 0.8, 1.2, 1.6):
        tube(f"towel_bar_{z}", [(SUITE_X - WT / 2 - 0.06, 1.6, z), (SUITE_X - WT / 2 - 0.06, 2.4, z)], 0.012, M["brass"])
    for s_ in (1.6, 2.4):
        tube(f"towel_rail_{s_}", [(SUITE_X - WT / 2 - 0.06, s_, 0.2), (SUITE_X - WT / 2 - 0.06, s_, 1.8)], 0.012, M["brass"])
    cushion("towel_hanging", (0.06, 0.6, 0.7), (SUITE_X - WT / 2 - 0.09, 2.0, 1.3), M["towel"], puff=0.45)
    A.plant("plant_bath", (-12.4, 1.6), M, 1.4)


# ---------------------------------------------------------------------------
def build_ceiling_lights(M):
    spots = [(3.8, -8.8), (3.7, -6.6), (3.7, -4.4),                                        # foyer / walkway
             (-3.5, -6.0), (-1.0, -6.0), (-5.0, -4.6), (0.2, -4.6),                        # kitchen
             (-4.6, -2.6), (-0.3, -2.6), (2.9, -1.5), (2.9, 1.0), (0.5, 4.0), (-3.5, 4.4),  # dining / living west
             (7.4, -8.4), (9.6, -8.4), (7.4, -6.0), (9.6, -6.0), (7.4, -3.4), (9.6, -3.4), (8.5, -1.5),  # study
             (-8.2, -8.6), (-11.6, -8.6), (-8.2, -5.0), (-11.6, -5.0), (-13.6, -6.8),       # bedroom
             (-7.9, -2.6), (-7.9, 0.0),                                                     # vestibule
             (-14.0, -2.4), (-14.0, 0.2), (-11.0, -2.6), (-11.0, 0.0),                     # closet
             (-13.0, 2.4), (-9.5, 2.4), (-7.0, 2.6), (-13.9, 5.0), (-7.0, 6.0)]              # bathroom
    discs = []
    for i, (x, y) in enumerate(spots):
        discs.append(((0.09, 0.09, 0.006), (x, y, H - 0.002)))
        A.spot(f"downlight_{i}", (x, y, H - 0.02), 32)
    multi_box("downlights", discs, M["downlight"], group=None)
    for x in (6.6, 9.4):
        A.area_light(f"slot_living_{x}", (x, 3.3, H - 0.03), (0.05, 5.5), 140, (1.0, 0.82, 0.62))
    A.area_light("slot_kitchen", (-2.5, -8.8, H - 0.03), (5.9, 0.05), 70, (1.0, 0.84, 0.66))
    A.area_light("slot_walkway", (3.7, -5.6, H - 0.03), (0.05, 3.5), 60, (1.0, 0.84, 0.66))


def build(M=None):
    A.H = H
    A.XW = XW
    M = M or A.make_materials()
    mats(M)
    SKIRT.clear()
    build_shell(M)
    build_glazing(M)
    build_curtains(M)
    build_doors(M)
    build_entry(M)
    build_gallery(M)
    build_kitchen(M)
    build_dining(M)
    build_living(M)
    build_study(M)
    build_closet(M)
    build_bedroom(M)
    build_bathroom(M)
    build_ceiling_lights(M)
    return M
