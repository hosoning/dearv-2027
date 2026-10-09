"""DearV big flat (大平層) — layout from the owners' floor-plan drawing.

Blender space: X east, Y north (the harbour glazing), Z up, metres. Plan "top" is the
entrance side (south, y = YS) and plan "bottom" is the full-height glass (north, y = YN).

  x=-15                     -6.0          0.8      4.1                 11
  y=-10 ┌──────[glass]────────┬─── corridor ─door──┬────────────────────┐
        │ BED (headboard W)   │ ══ counter ══╗hall │                    │
        │                     │ ║tall        ║     door  STUDY         │
        │       vitrine S     │ ║run  island+table │   desk, travel    │
  -2.75 ├──letter wall────────┤ ║            dining│   wall, books     │
        │ CLOSET (U wardrobe  walk                 │                    │
        │ + island, opens E) │door  L-SOFA  coffee │   reading lounge  │
  y=2.3 ├──────────────door──┤      table     TV ▐ │                    │
        │ BATH (tub at glass)door                  │                    │
  y=7   └═══════════════ full-height harbour glazing ═══════════════════┘
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
SUITE_X = -6.0      # suite column / kitchen-living wall
STUDY_X = 4.1       # hall-living / study wall (full depth)
BATH_Y = 2.3        # closet+walkway / bathroom wall
CLOSET_Y = -2.75    # north face of the bedroom / closet wall
CLOSET_X = -8.2     # closet opens to the suite walkway east of this
KPART_Y = -8.1      # low partition behind the kitchen counter (corridor to the south)
KITCH_E = 0.8       # east end of the kitchen counter
DOOR_X = (1.9, 3.1)  # front door opening in the south wall
BED_GLAZE = (-14.6, -10.4)
SPAWN = ((2.5, -9.1, 1.62), (2.5, 4.0, 1.4))
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
    M["knit_cream"] = material("knit_cream", color=(0.88, 0.84, 0.76), albedo="wool_albedo", normal="wool_normal",
                               rough=0.95, tile=(0.08, 0.08), sheen=0.7)
    M["knit_grey"] = material("knit_grey", color=(0.5, 0.5, 0.52), albedo="wool_albedo", normal="wool_normal",
                              rough=0.95, tile=(0.08, 0.08), sheen=0.7)
    M["denim"] = material("denim", color=(0.2, 0.28, 0.42), albedo="linen_albedo", rough=0.85, tile=(0.1, 0.1))
    for b in ("hermes", "chanel", "dior", "loropiana", "tomford", "cartier"):
        M[f"brand_{b}"] = material(f"brand_{b}", albedo=f"brand_{b}_albedo", rough=0.5)
    M["map"] = material("world_map", albedo="world_map_albedo", rough=0.8)
    M["alu"] = material("aluminium", color=(0.8, 0.81, 0.83), metal=1.0, rough=0.25)
    M["steel"] = material("brushed_steel", color=(0.72, 0.72, 0.72), metal=1.0, rough=0.32)
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
    # kitchen
    M["k_front"] = material("kitchen_front", color=(0.86, 0.84, 0.8), rough=0.42, coat=0.15)
    M["liner"] = material("fridge_liner", color=(0.93, 0.94, 0.95), rough=0.22)
    M["fridge_light"] = material("fridge_light", color=(1, 1, 1), emission=(0.92, 0.96, 1.0), emission_strength=4.0)
    M["niche_light"] = material("niche_light", color=(1, 0.95, 0.88), emission=(1.0, 0.86, 0.66), emission_strength=2.0)
    M["blackglass"] = material("black_glass", color=(0.015, 0.015, 0.018), rough=0.06, coat=1.0)
    M["clear_glass"] = material("clear_glass_obj", color=(0.86, 0.92, 0.92), rough=0.05, alpha=0.35)
    food = {
        "milk": (0.96, 0.96, 0.94), "egg": (0.93, 0.86, 0.74), "tomato": (0.78, 0.12, 0.08),
        "lettuce": (0.42, 0.66, 0.25), "carrot": (0.92, 0.45, 0.1), "lemon": (0.95, 0.82, 0.2),
        "cheese": (0.95, 0.8, 0.4), "butter": (0.97, 0.9, 0.6), "wine_red": (0.25, 0.02, 0.05),
        "wine_white": (0.75, 0.72, 0.4), "juice": (0.98, 0.6, 0.12), "yoghurt": (0.95, 0.93, 0.92),
        "berry": (0.35, 0.05, 0.22), "salmon": (0.95, 0.52, 0.38), "beef": (0.6, 0.12, 0.12),
        "jam": (0.55, 0.05, 0.1), "pasta": (0.92, 0.8, 0.5), "rice": (0.95, 0.94, 0.9), "tin": (0.75, 0.74, 0.7),
        "label_red": (0.65, 0.08, 0.1), "label_blue": (0.12, 0.25, 0.5), "label_green": (0.2, 0.4, 0.22),
        "coffee_bean": (0.25, 0.14, 0.08), "oil": (0.62, 0.55, 0.12), "kraft": (0.66, 0.52, 0.36),
        "ice": (0.86, 0.92, 0.98), "dumpling": (0.95, 0.93, 0.86), "grape": (0.45, 0.6, 0.2), "apple": (0.75, 0.1, 0.1),
        "orange": (0.95, 0.5, 0.08), "basil": (0.2, 0.45, 0.15), "cork": (0.62, 0.48, 0.3),
    }
    for k, c in food.items():
        M[f"f_{k}"] = material(f"food_{k}", color=c, rough=0.45 if k not in ("wine_red", "wine_white", "oil", "jam") else 0.08,
                               coat=0.3 if k in ("tomato", "apple", "lemon", "orange", "grape", "berry") else 0.0)
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


def vwall(M, name, x, spans, lintels=(), lintel_z=2.3):
    """Interior wall along y at x with door openings between the given solid spans."""
    x0, x1 = x - WT / 2, x + WT / 2
    for i, (y0, y1) in enumerate(spans):
        wall(M, f"{name}_{i}", x0, y0, x1, y1)
        skirt(x0 - 0.009, y0, x0 - 0.009, y1); skirt(x1 + 0.009, y0, x1 + 0.009, y1)
    for i, (y0, y1) in enumerate(lintels):
        wall(M, f"{name}_lintel_{i}", x0, y0, x1, y1, lintel_z, H, collide=False)


def hwall(M, name, y, spans, lintels=(), lintel_z=2.3):
    y0, y1 = y - WT / 2, y + WT / 2
    for i, (x0, x1) in enumerate(spans):
        wall(M, f"{name}_{i}", x0, y0, x1, y1)
        skirt(x0, y0 - 0.009, x1, y0 - 0.009); skirt(x0, y1 + 0.009, x1, y1 + 0.009)
    for i, (x0, x1) in enumerate(lintels):
        wall(M, f"{name}_lintel_{i}", x0, y0, x1, y1, lintel_z, H, collide=False)


def build_shell(M):
    A_ = "arch"
    def floor(name, x0, y0, x1, y1, mat):
        box(name, (x1 - x0, y1 - y0, 0.1), ((x0 + x1) / 2, (y0 + y1) / 2, -0.05), mat, group=A_)
    floor("floor_marble_corridor", SUITE_X, YS, STUDY_X, KPART_Y, M["marble"])
    floor("floor_marble_hall", KITCH_E, KPART_Y, STUDY_X, -6.0, M["marble"])
    floor("floor_terrazzo_kitchen", SUITE_X, KPART_Y, KITCH_E, -1.7, M["terrazzo"])
    floor("floor_oak_dining", KITCH_E, -6.0, STUDY_X, -1.7, M["oak"])
    floor("floor_oak_living", SUITE_X, -1.7, STUDY_X, YN, M["oak"])
    floor("floor_oak_suite", XW, YS, SUITE_X, BATH_Y, M["oak"])
    floor("floor_bath", XW, BATH_Y, SUITE_X, YN, M["bath_stone"])
    floor("floor_oak_study", STUDY_X, YS, XE, YN, M["oak"])
    box("ceiling", (XE - XW + 0.5, YN - YS + 0.5, 0.12), ((XW + XE) / 2, (YS + YN) / 2, H + 0.06), M["ceiling"], group=A_)

    # Exterior walls: north is all glass; the bedroom looks south, the bath west, the study east
    b0, b1 = BED_GLAZE
    wall(M, "wall_south_a", XW - EXT, YS - EXT, b0, YS)
    wall(M, "wall_south_b", b1, YS - EXT, DOOR_X[0], YS)
    wall(M, "wall_south_c", DOOR_X[1], YS - EXT, XE + EXT, YS)
    wall(M, "wall_south_lintel", DOOR_X[0], YS - EXT, DOOR_X[1], YS, 2.45, H, collide=False)
    wall(M, "wall_west_a", XW - EXT, YS - EXT, XW, 2.6)
    wall(M, "wall_west_b", XW - EXT, 6.8, XW, YN)
    wall(M, "wall_east_a", XE, YS - EXT, XE + EXT, -9.7)
    wall(M, "wall_east_b", XE, 6.8, XE + EXT, YN)
    skirt(XW + 0.01, YS + 0.01, b0, YS + 0.01); skirt(b1, YS + 0.01, DOOR_X[0], YS + 0.01)
    skirt(DOOR_X[1], YS + 0.01, XE - 0.01, YS + 0.01)
    skirt(XW + 0.01, YS, XW + 0.01, 2.6)

    # Interior walls
    vwall(M, "suite_wall", SUITE_X, [(YS, 0.9), (1.9, 2.9), (3.8, YN - 0.12)], [(0.9, 1.9), (2.9, 3.8)])
    hwall(M, "bath_wall", BATH_Y, [(XW, -7.7), (-6.8, SUITE_X - WT / 2)], [(-7.7, -6.8)])
    vwall(M, "study_wall", STUDY_X, [(YS, -8.5), (-7.1, YN - 0.12)], [(-8.5, -7.1)], lintel_z=2.45)
    cy0, cy1 = CLOSET_Y - WT, CLOSET_Y
    wall(M, "closet_wall", XW, cy0, CLOSET_X, cy1)
    skirt(XW + 0.01, cy0 - 0.009, CLOSET_X, cy0 - 0.009)
    box("closet_wall_end", (0.06, WT + 0.02, H), (CLOSET_X - 0.03, CLOSET_Y - WT / 2, H / 2), M["walnut"], group=A_)
    multi_box("skirting", SKIRT, M["satin"], group=A_)

    # Ceiling details: linear light slots
    slots = [((7.6, 0.05, 0.02), (-1.2, y, H - 0.005)) for y in (-0.5, 6.2)]
    slots += [((6.0, 0.05, 0.02), (-2.5, -7.7, H - 0.005)), ((0.05, 14.5, 0.02), (7.6, -2.5, H - 0.005))]
    multi_box("ceiling_led_slots", slots, M["ledstrip"], group=None)
    box("pelmet", (XE - XW, 0.36, 0.22), ((XW + XE) / 2, YN - 0.38, H - 0.11), M["ceiling"], group=A_)
    box("pelmet_bed", (b1 - b0 + 0.4, 0.36, 0.22), ((b0 + b1) / 2, YS + 0.38, H - 0.11), M["ceiling"], group=A_)
    box("pelmet_study", (0.36, 16.5, 0.22), (XE - 0.38, -1.45, H - 0.11), M["ceiling"], group=A_)


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
        box(f"{name}_head", (L, 0.3, H - gh + 0.05), ((a0 + a1) / 2, line, (gh + H) / 2), M["plaster"], group="arch")
    else:
        add_collider(line - 0.2, a0, line + 0.2, a1)
        box(f"{name}_head", (0.3, L, H - gh + 0.05), (line, (a0 + a1) / 2, (gh + H) / 2), M["plaster"], group="arch")


def build_glazing(M):
    glazing_run(M, "glaze_n", "x", YN, XW, XE, -1)
    glazing_run(M, "glaze_s_bed", "x", YS, BED_GLAZE[0], BED_GLAZE[1], 1)
    glazing_run(M, "glaze_w_bath", "y", XW, 2.6, 6.8, 1)
    glazing_run(M, "glaze_e_study", "y", XE, -9.7, 6.8, -1)
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
    lw = (STUDY_X - SUITE_X) / 2
    curtain(M, "curtain_living_w", "x", YN, SUITE_X + 0.1, 1, lw - 0.1, M["sheer"], 0.1, -0.22)
    curtain(M, "curtain_living_e", "x", YN, STUDY_X - 0.1, -1, lw - 0.1, M["sheer"], 0.1, -0.22)
    bw = (SUITE_X - XW) / 2
    curtain(M, "curtain_bath_w", "x", YN, XW + 0.1, 1, bw - 0.1, M["sheer"], 0.12, -0.22)
    curtain(M, "curtain_bath_e", "x", YN, SUITE_X - 0.1, -1, bw - 0.1, M["sheer"], 0.12, -0.22)
    b0, b1 = BED_GLAZE
    curtain(M, "curtain_bed_w", "x", YS, b0 + 0.05, 1, (b1 - b0) / 2, M["blackout"], 0.14, 0.22)
    curtain(M, "curtain_bed_e", "x", YS, b1 - 0.05, -1, (b1 - b0) / 2, M["blackout"], 0.14, 0.22)
    sw = (XE - STUDY_X) / 2
    curtain(M, "curtain_study_nw", "x", YN, STUDY_X + 0.1, 1, sw - 0.1, M["sheer"], 0.12, -0.22)
    curtain(M, "curtain_study_ne", "x", YN, XE - 0.1, -1, sw - 0.1, M["sheer"], 0.12, -0.22)
    curtain(M, "curtain_study_s", "y", XE, -9.6, 1, 8.1, M["sheer"], 0.08, -0.22)
    curtain(M, "curtain_study_n", "y", XE, 6.7, -1, 8.1, M["sheer"], 0.08, -0.22)
    for name, label, target, loc in (
            ("curtain_switch_living", "窗簾 · 客廳", "curtain_living", (STUDY_X - WT / 2 - 0.006, 6.3, 1.15)),
            ("curtain_switch_bed", "窗簾 · 睡房", "curtain_bed", (XW + 0.006, -8.45, 1.15)),
            ("curtain_switch_bath", "窗簾 · 浴室", "curtain_bath", (SUITE_X - WT / 2 - 0.006, 4.05, 1.15)),
            ("curtain_switch_study", "窗簾 · 書房", "curtain_study", (STUDY_X + WT / 2 + 0.006, -6.8, 1.15))):
        sw_ = box(name, (0.012, 0.08, 0.12), loc, M["satin"])
        interact(sw_, "curtains", label, target=target)


# ---------------------------------------------------------------------------
class Face:
    """A cabinet front plane. facing '+x' / '-x' / '+y' / '-y'; `line` is the front plane
    coordinate. Positions are given as (along, back, z): along the face, depth behind it."""

    def __init__(self, facing, line, group="furn"):
        self.n = 1 if facing[0] == "+" else -1
        self.xf = facing[1] == "x"
        self.line = line
        self.group = group

    def p(self, along, back, z):
        return (self.line - self.n * back, along, z) if self.xf else (along, self.line - self.n * back, z)

    def s(self, sa, sb, sz):
        return (sb, sa, sz) if self.xf else (sa, sb, sz)

    def vec(self, out):
        return [self.n * out, 0.0, 0.0] if self.xf else [0.0, self.n * out, 0.0]

    def box(self, name, sa, sb, sz, along, back, z, mat, **kw):
        kw.setdefault("group", self.group)
        return box(name, self.s(sa, sb, sz), self.p(along, back, z), mat, **kw)

    def collider(self, a0, a1, depth):
        (x0, y0, _), (x1, y1, _) = self.p(a0, 0, 0), self.p(a1, depth, 0)
        add_collider(min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))

    def swing_sign(self, hinge_hi):
        ua = -1 if hinge_hi else 1
        return 1 if ((-ua * self.n) if self.xf else (ua * self.n)) > 0 else -1

    def door(self, M, name, a0, a1, z0, z1, hinge_hi, label, mat, thick=0.022, angle=105, pull="v", glass=False):
        ah = a1 if hinge_hi else a0
        h = empty(name, self.p(ah, 0, z0))
        mid = (a0 + a1) / 2
        leaf = self.box(f"{name}_leaf", a1 - a0 - 0.004, thick, z1 - z0 - 0.004, mid, -thick / 2, (z0 + z1) / 2,
                        M["rail_glass"] if glass else mat, bevel=0.002, parent=h, group=None if glass else self.group)
        if glass:
            leaf["glass"] = 1
            fr = [(self.s(a1 - a0, thick + 0.004, 0.03), self.p(mid, -thick / 2, z)) for z in (z0 + 0.02, z1 - 0.02)]
            fr += [(self.s(0.03, thick + 0.004, z1 - z0), self.p(e, -thick / 2, (z0 + z1) / 2)) for e in (a0 + 0.015, a1 - 0.015)]
            multi_box(f"{name}_frame", fr, M["bronze"], parent=h, group=self.group)
        if pull:
            free = a0 + 0.045 if hinge_hi else a1 - 0.045
            ph = min(0.32, (z1 - z0) * 0.45)
            pz = z1 - 0.06 - ph / 2 if z1 < 1.2 else (z0 + 0.06 + ph / 2 if z0 > 1.2 else 1.05)
            self.box(f"{name}_pull", 0.014, 0.02, ph, free, -thick - 0.012, pz, M["brass"], bevel=0.005, parent=h)
        interact(h, "door", label, angle=self.swing_sign(hinge_hi) * angle)
        return h

    def drop_door(self, M, name, a0, a1, z0, z1, label, mat, angle=88, thick=0.03, glass=True):
        h = empty(name, self.p((a0 + a1) / 2, 0, z0))
        mid = (a0 + a1) / 2
        self.box(f"{name}_leaf", a1 - a0 - 0.004, thick, z1 - z0 - 0.004, mid, -thick / 2, (z0 + z1) / 2, mat,
                 bevel=0.003, parent=h)
        if glass:
            self.box(f"{name}_window", (a1 - a0) * 0.75, 0.004, (z1 - z0) * 0.45, mid, -thick - 0.001,
                     z0 + (z1 - z0) * 0.48, M["blackglass"], parent=h)
        self.box(f"{name}_handle", (a1 - a0) * 0.8, 0.022, 0.018, mid, -thick - 0.03, z1 - 0.06, M["steel"], bevel=0.007,
                 parent=h)
        sign = self.n if self.xf else -self.n
        interact(h, "door", label, angle=sign * angle, axis="y" if self.xf else "x")
        return h

    def drawer(self, M, name, a0, a1, z0, z1, label, mat, depth=0.5, fill=None, pull=True):
        mid, zc = (a0 + a1) / 2, (z0 + z1) / 2
        root = empty(name, self.p(mid, 0, zc))
        self.box(f"{name}_front", a1 - a0 - 0.004, 0.022, z1 - z0 - 0.004, mid, -0.011, zc, mat, bevel=0.002, parent=root)
        th = min(0.2, (z1 - z0) * 0.7)
        w = a1 - a0 - 0.06
        parts = [(self.s(w, depth - 0.04, 0.012), self.p(mid, depth / 2, z0 + 0.04)),
                 (self.s(0.012, depth - 0.04, th), self.p(mid - w / 2, depth / 2, z0 + 0.04 + th / 2)),
                 (self.s(0.012, depth - 0.04, th), self.p(mid + w / 2, depth / 2, z0 + 0.04 + th / 2)),
                 (self.s(w, 0.012, th), self.p(mid, depth - 0.03, z0 + 0.04 + th / 2))]
        multi_box(f"{name}_tray", parts, M["oakfurn"], parent=root, group=None)
        if pull:
            self.box(f"{name}_pull", min(0.34, (a1 - a0) * 0.5), 0.02, 0.014, mid, -0.034, z1 - 0.07, M["brass"],
                     bevel=0.006, parent=root)
        if fill:
            fill(root, mid, depth, z0 + 0.046)
        interact(root, "drawer", label, slide=self.vec(depth * 0.78))
        return root

    def hollow(self, M, name, a0, a1, z0, z1, depth, liner, group=None):
        """Open-fronted box (cabinet interior) behind the face."""
        t = 0.018
        mid = (a0 + a1) / 2
        parts = [(self.s(a1 - a0, t, z1 - z0), self.p(mid, depth - t / 2, (z0 + z1) / 2)),
                 (self.s(t, depth, z1 - z0), self.p(a0 + t / 2, depth / 2, (z0 + z1) / 2)),
                 (self.s(t, depth, z1 - z0), self.p(a1 - t / 2, depth / 2, (z0 + z1) / 2)),
                 (self.s(a1 - a0, depth, t), self.p(mid, depth / 2, z0 + t / 2)),
                 (self.s(a1 - a0, depth, t), self.p(mid, depth / 2, z1 - t / 2))]
        return multi_box(name, parts, liner, group=group)

    def shelves(self, M, name, a0, a1, zs, depth, mat, group=None, thick=0.02, front=0.0):
        parts = [(self.s(a1 - a0 - 0.04, depth - front - 0.04, thick), self.p((a0 + a1) / 2, front + (depth - front) / 2, z))
                 for z in zs]
        return multi_box(name, parts, mat, group=group)


def hinged_door(M, name, axis, line, a0, a1, hinge_at_end, angle, label, mat=None, glass=False, height=2.25, auto=True):
    """Room door leaf in a wall opening. axis='x': wall runs along y at x=line (leaf spans y a0..a1)."""
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
    interact(h, "door", label, angle=angle, auto=1 if auto else 0)
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
    # angles: positive = counter-clockwise seen from above
    hinged_door(M, "bedroom_door", "x", SUITE_X, 0.9, 1.9, False, 95, "主人房門", height=2.28)   # swings into the suite
    hinged_door(M, "bath_door_living", "x", SUITE_X, 2.9, 3.8, True, -95, "浴室門", height=2.28)  # into the bath
    hinged_door(M, "bath_door_suite", "y", BATH_Y, -7.7, -6.8, False, -95, "浴室門", height=2.28)  # into the suite
    hinged_door(M, "study_door_s", "x", STUDY_X, -8.5, -7.8, False, 100, "書房門", glass=True, height=2.43)
    hinged_door(M, "study_door_n", "x", STUDY_X, -7.8, -7.1, True, -100, "書房門", glass=True, height=2.43)


# ---------------------------------------------------------------------------
def seat(obj, label, pos, look, kind="sit"):
    """Make `obj` a place to sit / lie / sleep: camera goes to pos looking at look."""
    e1 = empty(f"{obj.name}_seatpt", pos)
    e2 = empty(f"{obj.name}_lookpt", look)
    interact(obj, kind, label, seat=e1.name, look=e2.name)
    return obj


def build_entry(M):
    """Front door + private lift lobby glow, tall shoe cabinet, console and round mirror."""
    x0, x1 = DOOR_X
    d = empty("front_door_hinge", (x0 + 0.02, YS - 0.05, 0))
    box("front_door_leaf", (x1 - x0 - 0.04, 0.06, 2.4), ((x0 + x1) / 2, YS - 0.05, 1.2), M["walnut"], bevel=0.006, parent=d)
    box("front_door_pull", (0.03, 0.05, 1.2), (x1 - 0.15, YS + 0.01, 1.15), M["brass"], bevel=0.01, parent=d)
    box("front_door_lock", (0.07, 0.02, 0.16), (x1 - 0.15, YS, 1.5), M["tvbody"], bevel=0.008, parent=d)
    interact(d, "door", "大門", angle=-80)
    add_collider(x0, YS - 0.4, x1, YS)
    xc = (x0 + x1) / 2
    frame = [((0.06, 0.32, 2.48), (x0 - 0.03, YS - 0.12, 1.24)), ((0.06, 0.32, 2.48), (x1 + 0.03, YS - 0.12, 1.24)),
             ((x1 - x0 + 0.12, 0.32, 0.06), (xc, YS - 0.12, 2.47))]
    multi_box("front_door_frame", frame, M["satin"], bevel=0.004)
    lobby = material("lobby_wall", color=(0.85, 0.78, 0.68), emission=(1, 0.85, 0.65), emission_strength=0.6)
    box("lobby_floor", (2.6, 2.0, 0.1), (xc, YS - 1.3, -0.05), M["marble"], group=None)
    box("lobby_back", (2.6, 0.1, H), (xc, YS - 2.3, H / 2), lobby, group=None)
    for sx in (-1, 1):
        box(f"lobby_side_{sx}", (0.1, 2.0, H), (xc + sx * 1.25, YS - 1.3, H / 2), M["satin"], group=None)
    box("lobby_ceiling", (2.6, 2.0, 0.1), (xc, YS - 1.3, H), M["satin"], group=None)
    box("entry_mat", (1.1, 0.7, 0.012), (xc, YS + 0.55, 0.006), M["rug2"])

    # tall shoe cabinet on the study wall, with a lit bench niche and openable doors
    F = Face("-x", STUDY_X - WT / 2 - 0.45)
    a0, a1 = YS + 0.05, -8.65
    F.box("shoe_cab_carcass_low", a1 - a0, 0.43, 0.42, (a0 + a1) / 2, 0.22, 0.21, M["walnut"], bevel=0.004)
    F.box("shoe_cab_top", a1 - a0, 0.45, 0.04, (a0 + a1) / 2, 0.225, H - 0.02, M["walnut"])
    F.box("shoe_niche_back", a1 - a0, 0.02, 0.62, (a0 + a1) / 2, 0.43, 0.75, M["oakfurn"])
    F.box("shoe_niche_shelf", a1 - a0, 0.43, 0.03, (a0 + a1) / 2, 0.22, 1.08, M["walnut"])
    cushion("shoe_bench_pad", F.s(a1 - a0 - 0.1, 0.36, 0.06), F.p((a0 + a1) / 2, 0.2, 0.45), M["leather"], puff=0.4,
            group="kitch")
    box("shoe_niche_led", F.s(a1 - a0 - 0.1, 0.02, 0.006), F.p((a0 + a1) / 2, 0.1, 1.06), M["ledstrip"], group=None)
    F.hollow(M, "shoe_cab_inside", a0, a1, 1.1, H - 0.04, 0.42, M["oakfurn"], group=None)
    F.shelves(M, "shoe_cab_shelves", a0, a1, [1.45, 1.8, 2.15, 2.5], 0.42, M["oakfurn"])
    shoes = [(0.05, 0.05, 0.05), (0.9, 0.9, 0.88), (0.55, 0.33, 0.17), (0.6, 0.05, 0.06), (0.86, 0.75, 0.62)]
    for j, z in enumerate((1.11, 1.46, 1.81, 2.16)):
        for k in range(3):
            m_ = material(f"shoe_{(j + k) % 5}", color=shoes[(j + k) % 5], rough=0.4)
            for s_ in (-1, 1):
                cushion(f"shoe_cab_shoe_{j}_{k}_{s_}", F.s(0.09, 0.27, 0.08), F.p(a0 + 0.22 + k * 0.4 + s_ * 0.055, 0.2, z + 0.05),
                        m_, puff=0.45, group=None)
    nd = 2
    dw = (a1 - a0) / nd
    for i in range(nd):
        F.door(M, f"shoe_cab_door_{i}", a0 + i * dw, a0 + (i + 1) * dw, 1.1, H - 0.04, i == 1, "鞋櫃", M["walnut"])
    F.collider(a0, a1, 0.45)
    for k, (dx, col) in enumerate(((-0.4, (0.05, 0.05, 0.05)), (0.0, (0.9, 0.9, 0.88)))):
        m_ = material(f"shoe_floor_{k}", color=col, rough=0.4)
        for s_ in (-1, 1):
            cushion(f"entry_shoe_{k}_{s_}", (0.1, 0.28, 0.09), (x1 + 0.25 + dx + s_ * 0.06, YS + 0.3, 0.05), m_, puff=0.45)

    # console + round mirror on the south wall, west of the door
    cx, cy = 0.9, YS + 0.22
    box("entry_console", (1.5, 0.36, 0.06), (cx, cy, 0.86), M["walnut"], bevel=0.01)
    for dx in (-0.7, 0.7):
        box(f"entry_console_leg_{dx}", (0.03, 0.3, 0.86), (cx + dx, cy, 0.43), M["brass"])
    add_collider(cx - 0.78, YS, cx + 0.78, YS + 0.42)
    cylinder("entry_mirror", 0.5, 0.02, (cx, YS + 0.02, 1.8), M["mirror"], segs=64, rot=(R(90), 0, 0))
    cylinder("entry_mirror_frame", 0.52, 0.015, (cx, YS + 0.01, 1.8), M["brass"], segs=64, rot=(R(90), 0, 0))
    key_tray = cylinder("entry_bowl", 0.12, 0.05, (cx + 0.4, cy, 0.915), M["ceramic"], r2=0.07, segs=32)
    del key_tray
    cylinder("entry_vase", 0.06, 0.32, (cx - 0.45, cy, 1.05), M["ceramic"], r2=0.04, segs=32)
    A.pendant_globe("foyer_pendant", (xc, -8.9, 2.25), M)


def build_gallery(M):
    """The corridor behind the kitchen: memory photographs on the south wall, a long bench."""
    wy = YS + 0.03
    frames = [(-5.0, 1.75, 0.7, 0.9), (-4.1, 1.95, 0.8, 0.6), (-4.1, 1.27, 0.8, 0.55), (-3.15, 1.7, 0.6, 0.8),
              (-2.4, 2.02, 0.4, 0.4), (-2.4, 1.45, 0.4, 0.5), (-1.6, 1.75, 0.7, 0.9)]
    for i, (x, z, w, h) in enumerate(frames):
        g = empty(f"frame_{i}", (x, wy, z))
        box(f"frame_{i}_wood", (w, 0.035, h), (x, wy, z), M["walnut"], bevel=0.006, parent=g, group="kitch")
        box(f"frame_{i}_mat", (w - 0.06, 0.01, h - 0.06), (x, wy + 0.02, z), M["mat"], parent=g, group="kitch")
        p = box(f"frame_{i}_photo", (w - 0.16, 0.004, h - 0.16), (x, wy + 0.027, z), M[f"photo{i}"], parent=g,
                group="kitch")
        p["uvfit"] = "-xz"
        interact(p, "photo", f"回憶相框 {i + 1}", index=i)
    box("gallery_rail", (4.6, 0.1, 0.04), (-3.3, wy + 0.08, 2.6), M["brass"], bevel=0.01, group="kitch")
    box("gallery_led", (4.5, 0.07, 0.004), (-3.3, wy + 0.08, 2.578), M["ledstrip"], group=None)
    A.area_light("gallery_led", (-3.3, wy + 0.3, 2.5), (4.4, 0.06), 50, (1.0, 0.85, 0.65), rot=(R(-35), 0, 0))
    bench = cushion("gallery_bench_pad", (1.8, 0.42, 0.08), (-3.3, YS + 0.3, 0.46), M["leather"], puff=0.4, group="kitch")
    for dx in (-0.8, 0.8):
        box(f"gallery_bench_leg_{dx}", (0.04, 0.38, 0.42), (-3.3 + dx, YS + 0.3, 0.21), M["brass"], group="kitch")
    add_collider(-4.2, YS, -2.4, YS + 0.52)
    seat(bench, "坐下看看相片", (-3.3, YS + 0.32, 1.12), (-3.3, -5.0, 1.3))
    A.plant("plant_corridor", (-5.55, YS + 0.45), M, 1.8)


# ---------------------------------------------------------------------------
def _food_fridge(M, F, a0, a1, depth):
    """Fridge contents on glass shelves (not lightmapped; the interior is lit live)."""
    g = None
    def at(along, back, z):
        return F.p(along, back, z)
    mid = (a0 + a1) / 2
    # shelf 1 (z 0.55): crisper area stays below; eggs, butter, cheese
    for i in range(2):
        for j in range(3):
            sphere(f"fr_egg_{i}_{j}", 0.022, at(a0 + 0.12 + j * 0.05, 0.12 + i * 0.05, 1.37), M["f_egg"],
                   scale=(1, 1, 1.25), segs=12, group=g)
    box("fr_egg_tray", F.s(0.18, 0.12, 0.02), at(a0 + 0.17, 0.145, 1.34), M["liner"], group=g)
    box("fr_butter", F.s(0.12, 0.07, 0.05), at(mid + 0.05, 0.2, 1.37), M["f_butter"], bevel=0.006, group=g)
    cylinder("fr_cheese", 0.07, 0.06, at(a1 - 0.18, 0.25, 1.37), M["f_cheese"], segs=24, group=g)
    # shelf 2 (z 0.95): yoghurt cups, berries box, leftovers in glass boxes
    for k in range(4):
        cylinder(f"fr_yoghurt_{k}", 0.035, 0.07, at(a0 + 0.12 + k * 0.08, 0.15, 0.995), M["f_yoghurt"], r2=0.03,
                 segs=16, group=g)
    box("fr_berries", F.s(0.15, 0.11, 0.06), at(mid + 0.12, 0.18, 0.99), M["f_berry"], bevel=0.008, group=g)
    box("fr_leftover_box", F.s(0.22, 0.16, 0.08), at(a1 - 0.2, 0.3, 1.0), M["clear_glass"], bevel=0.01, group=g)
    box("fr_leftover", F.s(0.2, 0.14, 0.05), at(a1 - 0.2, 0.3, 0.99), M["f_dumpling"], bevel=0.02, group=g)
    # shelf 3 (z 1.35 above eggs is 1.7): wine + juice lying down
    for k, mat in enumerate(("f_wine_red", "f_wine_white")):
        cylinder(f"fr_wine_{k}", 0.037, 0.3, at(a0 + 0.2 + k * 0.1, 0.3, 1.76), M[mat], segs=20,
                 rot=(0, R(90), 0) if F.xf else (R(90), 0, 0), group=g)
    box("fr_juice", F.s(0.08, 0.08, 0.24), at(a1 - 0.15, 0.18, 1.84), M["f_juice"], bevel=0.006, group=g)
    # meat / fish tray on the bottom glass shelf
    box("fr_meat_tray", F.s(0.24, 0.16, 0.03), at(mid - 0.1, 0.2, 0.6), M["liner"], bevel=0.006, group=g)
    box("fr_salmon", F.s(0.2, 0.08, 0.025), at(mid - 0.1, 0.18, 0.625), M["f_salmon"], bevel=0.01, group=g)
    box("fr_beef", F.s(0.14, 0.09, 0.03), at(mid + 0.2, 0.22, 0.62), M["f_beef"], bevel=0.012, group=g)
    # crisper drawers with vegetables
    def veg(root, along, depth_, z):
        for k in range(4):
            sphere(f"fr_tomato_{k}", 0.035, at(along - 0.15 + k * 0.07, 0.1 + 0.05 * (k % 2), z + 0.035), M["f_tomato"],
                   segs=14, parent=root, group=g)
        for k in range(3):
            cylinder(f"fr_carrot_{k}", 0.015, 0.18, at(along + 0.12, 0.12 + k * 0.04, z + 0.02), M["f_carrot"],
                     r2=0.004, segs=10, rot=(R(90), 0, 0) if not F.xf else (0, R(90), 0), parent=root, group=g)
        sphere("fr_lettuce", 0.08, at(along, 0.3, z + 0.07), M["f_lettuce"], scale=(1, 1.1, 0.8), segs=14, parent=root,
               group=g)
        for k in range(3):
            sphere(f"fr_lemon_{k}", 0.03, at(along - 0.1 + k * 0.06, 0.32, z + 0.03), M["f_lemon"], scale=(1, 1, 1.3),
                   segs=12, parent=root, group=g)
    FI = Face("+x" if F.n > 0 else "-x", F.line - F.n * 0.13) if F.xf else Face("+y" if F.n > 0 else "-y", F.line - F.n * 0.13)
    FI.drawer(M, "fridge_crisper", a0 + 0.03, a1 - 0.03, 0.1, 0.42, "冰箱 · 蔬果抽屜", M["clear_glass"], depth=depth - 0.15,
              fill=veg, pull=False)


def _door_bins(M, F, hinge, a0, a1, name, items):
    """Shelves on the inside face of an appliance door (they swing with it)."""
    zs = [0.55, 1.0, 1.45, 1.85]
    for k, z in enumerate(zs):
        F.box(f"{name}_bin_{k}", a1 - a0 - 0.12, 0.1, 0.08, (a0 + a1) / 2, 0.06, z, M["clear_glass"], parent=hinge, group=None)
        for j, it in enumerate(items[k]):
            if it is None:
                continue
            mat, r, h = it
            cylinder(f"{name}_bottle_{k}_{j}", r, h, F.p(a0 + 0.12 + j * 0.1, 0.06, z + h / 2 - 0.03), M[mat], segs=16,
                     parent=hinge, group=None)


def build_kitchen(M):
    """Open kitchen: tall appliance wall on the suite wall, a long counter backing onto the
    corridor, an island with an attached dining table. Doors, drawers and appliances open."""
    xk0 = SUITE_X + WT / 2            # tall run back
    tall_d = 0.62
    kf = KPART_Y + WT / 2 + 0.65       # counter front line (y)
    T = Face("+x", xk0 + tall_d)       # tall run front
    C = Face("+y", kf)                 # counter run front

    # ---- low partition + counter run --------------------------------------------------
    py0, py1 = KPART_Y - WT / 2, KPART_Y + WT / 2
    box("k_partition", (KITCH_E - xk0, WT, 1.12), ((xk0 + KITCH_E) / 2, KPART_Y, 0.56), M["plaster"], group="kitch")
    box("k_partition_cap", (KITCH_E - xk0 + 0.04, WT + 0.08, 0.03), ((xk0 + KITCH_E) / 2, KPART_Y, 1.135), M["marble"],
        bevel=0.004, group="kitch")
    box("k_backsplash", (KITCH_E - xk0, 0.02, 0.2), ((xk0 + KITCH_E) / 2, py1 + 0.01, 1.03), M["marble"], group="kitch")
    skirt(xk0, py0 - 0.009, KITCH_E, py0 - 0.009)
    a_start, a_end = xk0 + tall_d, KITCH_E - 0.05
    depth = kf - py1
    C.box("k_counter_carcass", KITCH_E - xk0, depth - 0.022, 0.78, (xk0 + KITCH_E) / 2, (depth + 0.022) / 2, 0.49,
          M["k_front"])
    C.box("k_toe", KITCH_E - xk0, depth - 0.07, 0.1, (xk0 + KITCH_E) / 2, (depth + 0.07) / 2, 0.05, M["blackmetal"])
    C.box("k_countertop", KITCH_E - xk0 + 0.02, depth + 0.03, 0.04, (xk0 + KITCH_E) / 2, (depth - 0.03) / 2, 0.9,
          M["marble"], bevel=0.004)
    C.box("k_waterfall", 0.04, depth + 0.03, 0.92, KITCH_E - 0.02 + 0.02, (depth - 0.03) / 2, 0.46, M["marble"], bevel=0.004)
    C.collider(xk0, KITCH_E + 0.02, depth + WT + 0.02)
    mods = []
    x = a_start
    for kind, w in (("drw3", 0.6), ("sink", 0.9), ("dw", 0.6), ("drw2", 0.9), ("hob", 0.9), ("drw3", 0.9), ("doors", 1.26)):
        mods.append((kind, x, min(x + w, a_end)))
        x += w

    def cutlery(root, along, d, z):
        for k in range(5):
            C.box(f"{root.name}_cutlery_{k}", 0.012, d * 0.6, 0.006, along - 0.18 + k * 0.08, d * 0.45, z + 0.003,
                  M["steel"], parent=root, group=None)
        C.box(f"{root.name}_organiser", 0.5, d * 0.7, 0.03, along, d * 0.45, z + 0.015, M["oakfurn"], parent=root, group=None)

    def pots(root, along, d, z):
        for k, (r, h) in enumerate(((0.12, 0.14), (0.1, 0.1))):
            cylinder(f"{root.name}_pot_{k}", r, h, C.p(along - 0.18 + k * 0.32, d * 0.45, z + h / 2), M["steel"], segs=24,
                     parent=root, group=None)

    def spices(root, along, d, z):
        for k in range(7):
            cylinder(f"{root.name}_jar_{k}", 0.025, 0.09, C.p(along - 0.3 + k * 0.1, d * 0.4, z + 0.045),
                     M[["f_kraft", "f_carrot", "f_basil", "f_cork"][k % 4]], segs=12, parent=root, group=None)

    for i, (kind, a0, a1) in enumerate(mods):
        if kind.startswith("drw"):
            n = int(kind[-1])
            hs = [0.2, 0.27, 0.27] if n == 3 else [0.3, 0.44]
            z = 0.1
            for j, hgt in enumerate(hs):
                fill = cutlery if (j == 0 and n == 3) else (pots if j == len(hs) - 1 else spices)
                C.drawer(M, f"k_drawer_{i}_{j}", a0, a1, z, z + hgt, "抽屜", M["k_front"], depth=depth - 0.06, fill=fill)
                z += hgt
        elif kind == "sink":
            C.door(M, f"k_sink_door_{i}_a", a0, (a0 + a1) / 2, 0.1, 0.88, False, "水槽櫃", M["k_front"])
            C.door(M, f"k_sink_door_{i}_b", (a0 + a1) / 2, a1, 0.1, 0.88, True, "水槽櫃", M["k_front"])
            C.hollow(M, "k_sink_cab_inside", a0 + 0.01, a1 - 0.01, 0.1, 0.87, depth - 0.05, M["oakfurn"])
            for k, col in enumerate(("f_label_blue", "f_lemon", "f_label_green")):
                cylinder(f"k_cleaner_{k}", 0.04, 0.24, C.p(a0 + 0.2 + k * 0.12, 0.3, 0.25), M[col], segs=16, group=None)
            sx = (a0 + a1) / 2
            C.box("k_sink_rim", 0.76, 0.48, 0.006, sx, depth / 2 - 0.02, 0.922, M["steel"], bevel=0.01)
            C.box("k_sink_basin", 0.68, 0.4, 0.004, sx, depth / 2 - 0.02, 0.926, M["blackmetal"])
            f = empty("faucet", C.p(sx, depth - 0.08, 0.92))
            fb = C.p(sx, depth - 0.08, 0.92)
            cylinder("k_faucet_base", 0.028, 0.05, (fb[0], fb[1], 0.945), M["brass"], segs=16, parent=f)
            sp = C.p(sx, depth - 0.29, 1.24)
            tube("k_faucet_neck", [(fb[0], fb[1], 0.93), (fb[0], fb[1], 1.3), C.p(sx, depth - 0.12, 1.38),
                                   C.p(sx, depth - 0.25, 1.36), C.p(sx, depth - 0.29, 1.27)], 0.013, M["brass"], parent=f)
            empty("k_faucet_spout", sp, parent=f)
            interact(bpy.data.objects["k_faucet_neck"], "faucet", "廚房水龍頭", spout="k_faucet_spout")
            box("k_soap", C.s(0.06, 0.06, 0.16), C.p(sx + 0.32, depth - 0.1, 1.0), M["f_label_green"], bevel=0.01)
            box("k_sponge", C.s(0.09, 0.06, 0.03), C.p(sx - 0.32, depth - 0.1, 0.935), M["f_lemon"], bevel=0.008)
        elif kind == "dw":
            C.drop_door(M, "k_dishwasher", a0, a1, 0.1, 0.88, "洗碗機", M["k_front"], angle=85, glass=False)
            C.hollow(M, "k_dishwasher_inside", a0 + 0.01, a1 - 0.01, 0.1, 0.87, depth - 0.05, M["steel"])
            for k in range(8):
                cylinder(f"k_dw_plate_{k}", 0.11, 0.008, C.p(a0 + 0.1 + k * 0.055, 0.3, 0.32), M["porcelain"], segs=24,
                         rot=(0, R(90), 0) if not C.xf else (R(90), 0, 0), group=None)
            for k in range(6):
                cylinder(f"k_dw_glass_{k}", 0.035, 0.12, C.p(a0 + 0.1 + k * 0.08, 0.25, 0.66), M["clear_glass"], segs=12,
                         group=None)
        elif kind == "hob":
            C.drawer(M, f"k_drawer_{i}_0", a0, a1, 0.1, 0.5, "鍋具抽屜", M["k_front"], depth=depth - 0.06, fill=pots)
            C.drawer(M, f"k_drawer_{i}_1", a0, a1, 0.5, 0.88, "鍋具抽屜", M["k_front"], depth=depth - 0.06, fill=pots)
            hx = (a0 + a1) / 2
            hob = C.box("k_hob", 0.8, 0.52, 0.006, hx, depth / 2, 0.923, M["blackglass"])
            for k, (dx, dy, r) in enumerate(((-0.2, -0.12, 0.1), (0.2, -0.12, 0.08), (-0.2, 0.12, 0.07), (0.2, 0.12, 0.11))):
                ring = cylinder(f"k_ring_{k}", r, 0.001, C.p(hx + dx, depth / 2 + dy, 0.927), M["bronze"], segs=32, parent=hob)
                ring["burner"] = 1
            interact(hob, "hob", "爐頭", pan="k_pan")
            cylinder("k_pot", 0.12, 0.16, C.p(hx - 0.2, depth / 2 + 0.12, 1.007), M["steel"], segs=32)
            cylinder("k_pot_lid", 0.125, 0.012, C.p(hx - 0.2, depth / 2 + 0.12, 1.093), M["clear_glass"], segs=32, group=None)
            sphere("k_pot_knob", 0.018, C.p(hx - 0.2, depth / 2 + 0.12, 1.11), M["blackmetal"], segs=12)
            cylinder("k_pan", 0.13, 0.04, C.p(hx + 0.2, depth / 2 - 0.12, 0.95), M["blackmetal"], segs=32)
            tube("k_pan_handle", [C.p(hx + 0.33, depth / 2 - 0.12, 0.96), C.p(hx + 0.55, depth / 2 - 0.2, 0.98)], 0.012,
                 M["walnut"])
            # ceiling hood over the hob
            hc = C.p(hx, depth / 2, H - 0.16)
            box("k_hood", (0.95, 0.62, 0.3) if not C.xf else (0.62, 0.95, 0.3), hc, M["steel"], bevel=0.01)
            box("k_hood_light", (0.7, 0.4, 0.006) if not C.xf else (0.4, 0.7, 0.006), (hc[0], hc[1], H - 0.312),
                M["niche_light"], group=None)
        elif kind == "doors":
            C.door(M, f"k_base_door_{i}_a", a0, (a0 + a1) / 2, 0.1, 0.88, False, "櫥櫃", M["k_front"])
            C.door(M, f"k_base_door_{i}_b", (a0 + a1) / 2, a1, 0.1, 0.88, True, "櫥櫃", M["k_front"])
            C.hollow(M, "k_base_cab_inside", a0 + 0.01, a1 - 0.01, 0.1, 0.87, depth - 0.05, M["oakfurn"])
            C.shelves(M, "k_base_cab_shelf", a0, a1, [0.48], depth - 0.05, M["oakfurn"])
            for k in range(6):
                cylinder(f"k_bowl_stack_{k}", 0.1, 0.035, C.p(a0 + 0.25, 0.3, 0.13 + k * 0.035), M["porcelain"], r2=0.06,
                         segs=24, group=None)
                cylinder(f"k_plate_stack_{k}", 0.13, 0.012, C.p(a1 - 0.3, 0.3, 0.5 + k * 0.014), M["porcelain"], segs=28,
                         group=None)
            for k in range(4):
                cylinder(f"k_mug_{k}", 0.04, 0.09, C.p(a0 + 0.2 + k * 0.1, 0.25, 0.545), M["ceramic"], segs=16, group=None)
    # counter-top life
    cx_ = mods[2][1]
    box("k_board", C.s(0.48, 0.32, 0.03), C.p(mods[3][1] + 0.4, depth / 2, 0.935), M["oakfurn"], bevel=0.01)
    for k in range(3):
        sphere(f"k_board_tomato_{k}", 0.03, C.p(mods[3][1] + 0.3 + k * 0.08, depth / 2, 0.97), M["f_tomato"], segs=12)
    box("k_knife_block", C.s(0.1, 0.16, 0.24), C.p(mods[5][1] + 0.6, depth - 0.12, 1.04), M["walnut"], bevel=0.01,
        rot=(R(-12), 0, 0))
    cylinder("k_crock", 0.07, 0.18, C.p(mods[4][2] + 0.15, depth - 0.12, 1.01), M["ceramic"], segs=24)
    for k in range(4):
        tube(f"k_utensil_{k}", [C.p(mods[4][2] + 0.15 + 0.02 * math.cos(k * 1.6), depth - 0.12 + 0.02 * math.sin(k * 1.6), 1.0),
                                C.p(mods[4][2] + 0.15 + 0.05 * math.cos(k * 1.6), depth - 0.12 + 0.05 * math.sin(k * 1.6), 1.32)],
             0.008, M["walnut"] if k % 2 else M["steel"])
    for k, (mat, r) in enumerate((("f_oil", 0.03), ("f_wine_red", 0.028), ("f_label_red", 0.025))):
        cylinder(f"k_bottle_{k}", r, 0.28, C.p(cx_ + 0.15 + k * 0.08, depth - 0.1, 1.06), M[mat], segs=16)
    for k in range(3):
        cylinder(f"k_herb_pot_{k}", 0.06, 0.1, C.p(mods[6][1] + 0.3 + k * 0.17, depth - 0.12, 0.97), M["pot"], segs=20)
        sphere(f"k_herb_{k}", 0.075, C.p(mods[6][1] + 0.3 + k * 0.17, depth - 0.12, 1.08), M["f_basil"],
               scale=(1, 1, 0.8), segs=14)
    cylinder("k_kettle", 0.08, 0.2, C.p(mods[0][1] + 0.3, depth - 0.15, 1.02), M["porcelain"], r2=0.06, segs=24)
    cylinder("k_kettle_base", 0.09, 0.02, C.p(mods[0][1] + 0.3, depth - 0.15, 0.93), M["blackmetal"], segs=24)
    tube("k_kettle_spout", [C.p(mods[0][1] + 0.38, depth - 0.15, 1.02), C.p(mods[0][1] + 0.45, depth - 0.15, 1.1)], 0.012,
         M["porcelain"])
    A.area_light("k_counter_glow", C.p((xk0 + KITCH_E) / 2, depth / 2, H - 0.05), (KITCH_E - xk0 - 0.4, 0.3), 60,
                 (1.0, 0.86, 0.68))

    # ---- tall appliance wall --------------------------------------------------------------
    t0 = kf                       # starts at the counter front
    T.box("k_tall_plinth", 3.9, tall_d - 0.05, 0.08, t0 + 1.95, (tall_d + 0.05) / 2, 0.04, M["blackmetal"])
    T.box("k_tall_crown", 3.9, tall_d, 0.04, t0 + 1.95, tall_d / 2, 2.6, M["k_front"])
    box("k_tall_bulkhead", (tall_d, 3.9, H - 2.62), (xk0 + tall_d / 2, t0 + 1.95, (H + 2.62) / 2), M["plaster"], group="arch")
    T.collider(t0, t0 + 3.92, tall_d)
    T.box("k_tall_end", 0.03, tall_d, 2.62, t0 + 3.915, tall_d / 2, 1.31, M["k_front"])
    # fridge (0.9) : hollow lit interior, glass shelves, door bins, crisper drawer
    f0, f1 = t0, t0 + 0.9
    T.hollow(M, "fridge_inside", f0, f1, 0.08, 2.58, tall_d - 0.04, M["liner"])
    T.shelves(M, "fridge_shelves", f0, f1, [0.56, 0.95, 1.33, 1.71], tall_d - 0.05, M["clear_glass"], front=0.13)
    T.box("fridge_light", 0.5, 0.25, 0.008, (f0 + f1) / 2, 0.3, 2.55, M["fridge_light"], group=None)
    _food_fridge(M, T, f0, f1, tall_d - 0.04)
    fd = T.door(M, "fridge_door", f0, f1, 0.08, 2.58, False, "冰箱", M["k_front"], thick=0.06, angle=110, pull=None)
    T.box("fridge_handle", 0.024, 0.03, 1.1, f1 - 0.06, -0.075, 1.25, M["brass"], bevel=0.01, parent=fd)
    T.box("fridge_door_liner", 0.82, 0.01, 2.3, (f0 + f1) / 2, 0.005, 1.33, M["liner"], parent=fd, group=None)
    _door_bins(M, T, fd, f0, f1, "fridge", [
        [("f_milk", 0.04, 0.24), ("f_juice", 0.04, 0.22), ("f_milk", 0.04, 0.24)],
        [("f_jam", 0.03, 0.1), ("f_label_red", 0.025, 0.14), ("f_oil", 0.02, 0.16), ("f_jam", 0.03, 0.1)],
        [("f_wine_white", 0.035, 0.28), None, ("f_label_green", 0.03, 0.18)],
        [("f_butter", 0.03, 0.06), ("f_cheese", 0.03, 0.06)]])
    # freezer (0.6)
    z0_, z1_ = f1, f1 + 0.6
    T.hollow(M, "freezer_inside", z0_, z1_, 0.08, 2.58, tall_d - 0.04, M["liner"])
    T.box("freezer_light", 0.3, 0.2, 0.008, (z0_ + z1_) / 2, 0.3, 2.55, M["fridge_light"], group=None)
    for k, z in enumerate((0.15, 0.7, 1.25, 1.8)):
        T.box(f"freezer_basket_{k}", 0.52, tall_d - 0.12, 0.4, (z0_ + z1_) / 2, (tall_d - 0.04) / 2, z + 0.2, M["clear_glass"],
              group=None)
        for j in range(3):
            T.box(f"freezer_item_{k}_{j}", 0.13, 0.18, 0.1 + 0.05 * (j % 2), z0_ + 0.12 + j * 0.17, 0.25, z + 0.08,
                  M[["f_ice", "f_dumpling", "f_label_blue", "f_berry"][(k + j) % 4]], bevel=0.01, group=None)
    T.door(M, "freezer_door", z0_, z1_, 0.08, 2.58, True, "冷凍庫", M["k_front"], thick=0.06, angle=110)
    # ovens (0.6): warming drawer, oven, steam oven, cabinet above
    o0, o1 = z1_, z1_ + 0.6
    T.drawer(M, "k_tall_drawer", o0, o1, 0.08, 0.6, "抽屜", M["k_front"], depth=tall_d - 0.06, fill=None)
    T.drawer(M, "k_warming_drawer", o0, o1, 0.6, 0.82, "暖碗抽屜", M["blackglass"], depth=tall_d - 0.1, fill=None)
    for name, z0, z1, label in (("k_oven", 0.82, 1.42, "焗爐"), ("k_steam_oven", 1.42, 1.9, "蒸焗爐")):
        T.box(f"{name}_cavity_back", 0.5, 0.02, z1 - z0 - 0.1, (o0 + o1) / 2, 0.5, (z0 + z1) / 2, M["blackmetal"], group=None)
        T.hollow(M, f"{name}_cavity", o0 + 0.03, o1 - 0.03, z0 + 0.04, z1 - 0.06, 0.5, M["blackmetal"])
        for k in range(2):
            T.box(f"{name}_rack_{k}", 0.5, 0.42, 0.006, (o0 + o1) / 2, 0.25, z0 + 0.15 + k * 0.18, M["steel"], group=None)
        T.box(f"{name}_panel", 0.58, 0.01, 0.07, (o0 + o1) / 2, -0.005, z1 - 0.04, M["blackglass"])
        T.drop_door(M, f"{name}_door", o0, o1, z0, z1 - 0.08, label, M["blackglass"])
    T.box("k_roast_dish", 0.34, 0.24, 0.06, (o0 + o1) / 2, 0.25, 1.0, M["ceramic"], bevel=0.02, group=None)
    for k in range(3):
        sphere(f"k_roast_potato_{k}", 0.035, T.p((o0 + o1) / 2 - 0.08 + k * 0.08, 0.25, 1.04), M["f_cheese"], segs=10,
               group=None)
    T.hollow(M, "k_tall_top_inside", o0, o1, 1.9, 2.58, tall_d - 0.04, M["oakfurn"])
    T.door(M, "k_tall_top_door", o0, o1, 1.9, 2.58, False, "上櫃", M["k_front"])
    # coffee niche (0.9)
    c0, c1 = o1, o1 + 0.9
    T.hollow(M, "k_niche", c0, c1, 0.92, 1.62, tall_d - 0.02, M["marble"], group="kitch")
    T.box("k_niche_counter", 0.9, tall_d - 0.02, 0.03, (c0 + c1) / 2, (tall_d - 0.02) / 2, 0.92, M["marble"])
    T.box("k_niche_led", 0.8, 0.02, 0.006, (c0 + c1) / 2, 0.08, 1.6, M["niche_light"], group=None)
    cm = T.p(c0 + 0.32, 0.3, 1.13)
    box("k_coffee_machine", T.s(0.32, 0.38, 0.4), cm, M["steel"], bevel=0.02)
    box("k_coffee_front", T.s(0.26, 0.01, 0.2), T.p(c0 + 0.32, 0.105, 1.22), M["blackglass"])
    cylinder("k_coffee_hopper", 0.06, 0.08, (cm[0], cm[1], 1.37), M["f_coffee_bean"], segs=16)
    cylinder("k_coffee_cup", 0.035, 0.06, T.p(c0 + 0.32, 0.15, 0.97), M["porcelain"], segs=16)
    for k in range(4):
        cylinder(f"k_niche_cup_{k}", 0.04, 0.08, T.p(c0 + 0.62 + (k % 2) * 0.1, 0.25 + (k // 2) * 0.12, 0.975),
                 M["ceramic"], segs=16)
    box("k_coffee_beans_jar", T.s(0.1, 0.1, 0.2), T.p(c1 - 0.12, 0.42, 1.035), M["clear_glass"], bevel=0.02, group=None)
    interact(bpy.data.objects["k_coffee_machine"], "coffee", "咖啡機 · 沖一杯")
    T.hollow(M, "k_niche_low_inside", c0, c1, 0.08, 0.9, tall_d - 0.04, M["oakfurn"])
    T.door(M, "k_niche_low_a", c0, (c0 + c1) / 2, 0.08, 0.9, False, "櫥櫃", M["k_front"])
    T.door(M, "k_niche_low_b", (c0 + c1) / 2, c1, 0.08, 0.9, True, "櫥櫃", M["k_front"])
    T.hollow(M, "k_niche_top_inside", c0, c1, 1.64, 2.58, tall_d - 0.04, M["oakfurn"])
    T.shelves(M, "k_niche_top_shelf", c0, c1, [2.1], tall_d - 0.04, M["oakfurn"])
    for k in range(5):
        cylinder(f"k_glass_{k}", 0.04, 0.2, T.p(c0 + 0.15 + k * 0.15, 0.3, 1.76), M["clear_glass"], segs=16, group=None)
        cylinder(f"k_tea_tin_{k}", 0.05, 0.14, T.p(c0 + 0.15 + k * 0.15, 0.3, 2.19), M[["f_label_red", "f_label_green",
                                                                                            "f_kraft", "f_tin", "f_label_blue"][k]],
                 segs=16, group=None)
    T.door(M, "k_niche_top_a", c0, (c0 + c1) / 2, 1.64, 2.58, False, "上櫃", M["k_front"])
    T.door(M, "k_niche_top_b", (c0 + c1) / 2, c1, 1.64, 2.58, True, "上櫃", M["k_front"])
    # pantry (0.9): tall double doors, shelves of jars, pasta, tins, wine
    p0, p1 = c1, c1 + 0.9
    T.hollow(M, "pantry_inside", p0, p1, 0.08, 2.58, tall_d - 0.04, M["oakfurn"])
    zs = [0.45, 0.85, 1.25, 1.65, 2.05]
    T.shelves(M, "pantry_shelves", p0, p1, zs, tall_d - 0.04, M["oakfurn"])
    for k in range(6):
        cylinder(f"pantry_wine_{k}", 0.037, 0.3, T.p(p0 + 0.1 + k * 0.13, 0.3, 0.2), M["f_wine_red" if k % 2 else "f_wine_white"],
                 segs=16, rot=(0, R(90), 0) if T.xf else (R(90), 0, 0), group=None)
    for j, z in enumerate(zs):
        for k in range(5):
            kind = (j + k) % 4
            p = T.p(p0 + 0.12 + k * 0.165, 0.28, z + 0.02)
            if kind == 0:
                cylinder(f"pantry_jar_{j}_{k}", 0.055, 0.22, (p[0], p[1], p[2] + 0.11), M["clear_glass"], segs=16, group=None)
                cylinder(f"pantry_jar_fill_{j}_{k}", 0.05, 0.16, (p[0], p[1], p[2] + 0.08),
                         M[["f_pasta", "f_rice", "f_coffee_bean"][k % 3]], segs=16, group=None)
            elif kind == 1:
                box(f"pantry_box_{j}_{k}", T.s(0.1, 0.06, 0.25), (p[0], p[1], p[2] + 0.125),
                    M[["f_label_blue", "f_label_red", "f_kraft"][k % 3]], bevel=0.004, group=None)
            elif kind == 2:
                for t in range(2):
                    cylinder(f"pantry_tin_{j}_{k}_{t}", 0.04, 0.11, (p[0], p[1], p[2] + 0.055 + t * 0.11), M["f_tin"], segs=16,
                             group=None)
            else:
                box(f"pantry_bag_{j}_{k}", T.s(0.12, 0.08, 0.2), (p[0], p[1], p[2] + 0.1), M["f_kraft"], bevel=0.02, group=None)
    T.door(M, "pantry_door_a", p0, (p0 + p1) / 2, 0.08, 2.58, False, "食物櫃", M["k_front"])
    T.door(M, "pantry_door_b", (p0 + p1) / 2, p1, 0.08, 2.58, True, "食物櫃", M["k_front"])

    # ---- island with an attached dining table ------------------------------------------
    ix0, ix1, iy0, iy1 = -4.1, -1.3, -4.6, -3.6
    I = Face("-y", iy0)
    box("island_base", (ix1 - ix0, 0.7, 0.86), ((ix0 + ix1) / 2, iy0 + 0.35 + 0.011, 0.45), M["walnut"], bevel=0.004,
        group="kitch")
    box("island_top", (ix1 - ix0 + 0.04, iy1 - iy0, 0.05), ((ix0 + ix1) / 2, (iy0 + iy1) / 2, 0.905), M["marble"],
        bevel=0.004, group="kitch")
    box("island_waterfall", (0.05, iy1 - iy0, 0.88), (ix0 - 0.005, (iy0 + iy1) / 2, 0.44), M["marble"], bevel=0.004,
        group="kitch")
    add_collider(ix0 - 0.04, iy0, ix1, iy1)
    cols = 3
    cw = (ix1 - ix0 - 0.05) / cols
    for c in range(cols):
        a0 = ix0 + 0.05 + c * cw
        for j, (z0, z1) in enumerate(((0.1, 0.48), (0.48, 0.88))):
            I.drawer(M, f"island_drawer_{c}_{j}", a0, a0 + cw, z0, z1, "中島抽屜", M["walnut"], depth=0.6,
                     fill=(lambda r, al, d, z: [cylinder(f"{r.name}_bowl_{k}", 0.1, 0.05, I.p(al - 0.15 + k * 0.25, 0.3, z + 0.025),
                                                         M["porcelain"], r2=0.07, segs=20, parent=r, group=None)
                                                for k in range(2)]) if j == 1 else None)
    sphere("island_bowl", 0.17, (-3.2, -4.1, 0.98), M["ceramic"], scale=(1, 1, 0.45))
    for i, (mat, dx, dy) in enumerate((("f_orange", 0, 0), ("f_apple", 0.07, 0.04), ("f_lemon", -0.06, 0.05),
                                       ("f_orange", 0.03, -0.07), ("f_apple", -0.05, -0.04))):
        sphere(f"island_fruit_{i}", 0.04, (-3.2 + dx, -4.1 + dy, 1.02 + 0.015 * (i % 2)), M[mat], segs=12)
    cylinder("island_vase", 0.07, 0.3, (-2.0, -4.0, 1.08), M["clear_glass"], r2=0.05, segs=24, group=None)
    for k in range(9):
        a = k * 2.4
        tube(f"island_stem_{k}", [(-2.0, -4.0, 1.0), (-2.0 + 0.08 * math.cos(a), -4.0 + 0.08 * math.sin(a), 1.4 + 0.03 * (k % 3))],
             0.004, M["f_basil"])
        sphere(f"island_tulip_{k}", 0.03, (-2.0 + 0.08 * math.cos(a), -4.0 + 0.08 * math.sin(a), 1.42 + 0.03 * (k % 3)),
               material("tulip", color=(0.95, 0.85, 0.82), rough=0.5, sheen=0.5), scale=(1, 1, 1.4), segs=10)
    box("island_cookbook", (0.24, 0.3, 0.03), (-2.6, -4.35, 0.945), M["book2"], bevel=0.004, rot=(0, 0, R(-8)))
    stools = []
    for i, x in enumerate((-3.7, -2.85, -2.0)):
        A.stool(f"stool_{i}", (x, -3.15), M)
        stools.append(bpy.data.objects[f"stool_{i}_seat"])
    seat(stools[1], "坐在中島", (-2.85, -3.15, 1.25), (-2.85, -7.5, 1.0))
    # dining table, butting onto the island's east end
    tx0, tx1, ty0, ty1 = ix1, 0.9, -4.55, -3.65
    box("dining_top", (tx1 - tx0, ty1 - ty0, 0.05), ((tx0 + tx1) / 2, (ty0 + ty1) / 2, 0.75), M["walnut"], bevel=0.01,
        group="kitch")
    box("dining_pedestal", (0.12, 0.6, 0.72), (tx1 - 0.35, (ty0 + ty1) / 2, 0.36), M["darkmarble"], bevel=0.01, group="kitch")
    box("dining_pedestal_foot", (0.5, 0.7, 0.04), (tx1 - 0.35, (ty0 + ty1) / 2, 0.02), M["darkmarble"], bevel=0.01,
        group="kitch")
    add_collider(tx0, ty0, tx1, ty1)
    chairs = []
    for k, x in enumerate((-0.85, -0.05, 0.65)):
        A.chair(f"dining_chair_s{k}", (x, ty0 - 0.38), math.pi, M)
        A.chair(f"dining_chair_n{k}", (x, ty1 + 0.38), 0.0, M)
        add_collider(x - 0.24, ty0 - 0.62, x + 0.24, ty0 - 0.14)
        add_collider(x - 0.24, ty1 + 0.14, x + 0.24, ty1 + 0.62)
        chairs.append(bpy.data.objects[f"dining_chair_n{k}_seat"])
    seat(chairs[1], "坐下吃飯", (-0.05, ty1 + 0.4, 1.15), (-0.05, -6.5, 0.85))
    for k, x in enumerate((-0.85, -0.05, 0.65)):
        cylinder(f"dining_plate_{k}", 0.13, 0.012, (x, ty1 - 0.25, 0.783), M["porcelain"], segs=32)
        cylinder(f"dining_plate_s{k}", 0.13, 0.012, (x, ty0 + 0.25, 0.783), M["porcelain"], segs=32)
        cylinder(f"dining_glass_{k}", 0.035, 0.12, (x + 0.2, ty1 - 0.15, 0.835), M["clear_glass"], segs=16, group=None)
    box("dining_runner", (2.1, 0.3, 0.004), ((tx0 + tx1) / 2, (ty0 + ty1) / 2, 0.777), M["linen"])
    for k in range(3):
        cylinder(f"dining_candle_{k}", 0.025, 0.25 - 0.04 * k, (-0.45 + k * 0.25, (ty0 + ty1) / 2, 0.9 - 0.02 * k),
                 M["ceramic"], segs=16)
    for i, x in enumerate((-3.6, -2.7, -1.8)):
        A.pendant_globe(f"island_pendant_{i}", (x, -4.1, 1.95), M)
    for i, x in enumerate((-0.65, 0.4)):
        A.pendant_globe(f"dining_pendant_{i}", (x, -4.1, 1.75), M)
    interact(bpy.data.objects["island_pendant_1_glass"], "lamp", "中島吊燈", light="island_pendants")

    # wine cabinet in the hall (study wall), glass doors
    W = Face("-x", STUDY_X - WT / 2 - 0.55)
    w0, w1 = -5.6, -3.4
    W.box("wine_cab_carcass", w1 - w0, 0.55, 2.0, (w0 + w1) / 2, 0.275, 1.0, M["walnut"], bevel=0.004, group="kitch")
    W.hollow(M, "wine_cab_inside", w0 + 0.04, w1 - 0.04, 0.1, 1.95, 0.5, M["blackmetal"], group=None)
    W.box("wine_cab_led", w1 - w0 - 0.12, 0.02, 0.006, (w0 + w1) / 2, 0.06, 1.93, M["niche_light"], group=None)
    for r in range(9):
        z = 0.2 + r * 0.19
        W.box(f"wine_rack_{r}", w1 - w0 - 0.1, 0.45, 0.012, (w0 + w1) / 2, 0.28, z - 0.045, M["oakfurn"], group=None)
        for k in range(10):
            cylinder(f"wine_bottle_{r}_{k}", 0.036, 0.3, W.p(w0 + 0.15 + k * 0.2, 0.28, z), M["f_wine_red" if (r + k) % 3 else "f_wine_white"],
                     segs=12, rot=(0, R(90), 0) if W.xf else (R(90), 0, 0), group=None)
    W.door(M, "wine_cab_door_a", w0 + 0.02, (w0 + w1) / 2, 0.08, 1.98, False, "酒櫃", M["walnut"], glass=True)
    W.door(M, "wine_cab_door_b", (w0 + w1) / 2, w1 - 0.02, 0.08, 1.98, True, "酒櫃", M["walnut"], glass=True)
    W.collider(w0, w1, 0.55)
    A.plant("plant_hall", (3.5, -2.4), M, 1.9)


# ---------------------------------------------------------------------------
def plush_sofa(M, xb, y0, y1, chaise_len=1.9, prefix="sofa"):
    """Low L-shaped sofa built facing +X: back at xb, main run y0..y1, second arm at the
    y1 end running towards +x (with backs along its outer side). Built in local coords."""
    root = empty(prefix, (xb + 0.5, (y0 + y1) / 2, 0))
    D, L = 1.08, y1 - y0
    yc = (y0 + y1) / 2
    multi_box(f"{prefix}_plinth", [((D - 0.1, L - 0.1, 0.08), (xb + D / 2, yc, 0.07)),
                                   ((chaise_len - 0.1, D - 0.1, 0.08), (xb + D + chaise_len / 2 - 0.05, y1 - D / 2, 0.07))],
              M["blackmetal"], bevel=0.01, parent=root)
    cushion(f"{prefix}_base_main", (D, L, 0.24), (xb + D / 2, yc, 0.23), M["plush"], puff=0.16, parent=root)
    cushion(f"{prefix}_base_arm", (chaise_len, D, 0.24), (xb + D + chaise_len / 2 - 0.02, y1 - D / 2, 0.23), M["plush"],
            puff=0.16, parent=root)
    n = max(3, round(L / 1.05))
    seat_w = (L - D - 0.05) / n
    seats = []
    for i in range(n):
        y = y0 + 0.05 + seat_w * (i + 0.5)
        c = cushion(f"{prefix}_seat_{i}", (D - 0.22, seat_w - 0.02, 0.17), (xb + 0.22 + (D - 0.22) / 2, y, 0.435),
                    M["plush"], puff=0.42, parent=root)
        pts = [(xb + 0.24 + x, y + yy, 0.52) for x, yy in rounded_rect(D - 0.3, seat_w - 0.1, 0.08, 4)]
        tube(f"{prefix}_welt_{i}", pts + [pts[0]], 0.006, M["plush"], parent=root)
        cushion(f"{prefix}_back_{i}", (0.26, seat_w - 0.04, 0.56), (xb + 0.2, y, 0.74), M["plush"], puff=0.45,
                rot=(0, R(-10), 0), parent=root)
        seats.append((c, y))
    # corner seat
    cushion(f"{prefix}_seat_corner", (D - 0.22, D - 0.22, 0.17), (xb + 0.22 + (D - 0.22) / 2, y1 - (D + 0.22) / 2, 0.435),
            M["plush"], puff=0.42, parent=root)
    cushion(f"{prefix}_back_corner", (0.26, D - 0.1, 0.56), (xb + 0.2, y1 - D / 2, 0.74), M["plush"], puff=0.45,
            rot=(0, R(-10), 0), parent=root)
    # second arm: seats with backs along its outer (y1) side
    m = max(1, round((chaise_len - 0.2) / 1.05))
    sw = (chaise_len - 0.2) / m
    arm = []
    for i in range(m):
        x = xb + D + 0.02 + sw * (i + 0.5)
        c = cushion(f"{prefix}_arm_seat_{i}", (sw - 0.02, D - 0.22, 0.17), (x, y1 - 0.22 - (D - 0.22) / 2, 0.435), M["plush"],
                    puff=0.42, parent=root)
        cushion(f"{prefix}_arm_back_{i}", (sw - 0.04, 0.26, 0.56), (x, y1 - 0.2, 0.74), M["plush"], puff=0.45,
                rot=(R(10), 0, 0), parent=root)
        arm.append((c, x))
    cushion(f"{prefix}_back_frame", (0.22, L, 0.62), (xb + 0.11, yc, 0.55), M["plush"], puff=0.3, parent=root)
    cushion(f"{prefix}_arm_back_frame", (chaise_len, 0.22, 0.62), (xb + D + chaise_len / 2 - 0.02, y1 - 0.11, 0.55),
            M["plush"], puff=0.3, parent=root)
    cushion(f"{prefix}_end_arm", (D, 0.24, 0.5), (xb + D / 2, y0 - 0.1, 0.5), M["plush"], puff=0.42, parent=root)
    cushion(f"{prefix}_end_arm2", (0.24, D, 0.5), (xb + D + chaise_len + 0.08, y1 - D / 2, 0.5), M["plush"], puff=0.42,
            parent=root)
    for k, (dy, m_, rz) in enumerate(((0.25, "velvet", -6), (0.75, "linen", 5), (L - 1.3, "leather", 8))):
        cushion(f"{prefix}_pillow_{k}", (0.15, 0.5, 0.48), (xb + 0.36, y0 + dy, 0.8), M[m_], puff=0.48,
                rot=(R(4), R(-16), R(rz)), parent=root)
    cushion(f"{prefix}_pillow_arm", (0.5, 0.15, 0.48), (xb + D + chaise_len - 0.4, y1 - 0.36, 0.8), M["velvet"], puff=0.48,
            rot=(R(16), R(4), R(-6)), parent=root)
    cushion(f"{prefix}_throw", (0.55, 1.1, 0.05), (xb + 0.65, y0 + 0.9, 0.57), M["linen"], puff=0.45,
            rot=(0, R(-3), R(6)), parent=root)
    add_collider(xb, y0 - 0.22, xb + D, y1)
    add_collider(xb + D, y1 - D, xb + D + chaise_len + 0.2, y1)
    return root, seats, arm, D


def armchair(M, name, x, y, rz, mat, sit_label=None, look=None):
    ch = empty(name, (x, y, 0))
    s = cushion(f"{name}_seat", (0.78, 0.8, 0.2), (x, y - 0.05, 0.36), mat, puff=0.35, parent=ch)
    cushion(f"{name}_back", (0.78, 0.18, 0.62), (x, y + 0.35, 0.68), mat, puff=0.4, rot=(R(-12), 0, 0), parent=ch)
    for dx in (-0.36, 0.36):
        box(f"{name}_arm_{dx}", (0.06, 0.78, 0.06), (x + dx, y, 0.56), M["walnut"], bevel=0.02, parent=ch)
        box(f"{name}_leg_f_{dx}", (0.05, 0.05, 0.56), (x + dx, y - 0.35, 0.28), M["walnut"], bevel=0.015,
            rot=(R(-6), 0, 0), parent=ch)
        box(f"{name}_leg_b_{dx}", (0.05, 0.05, 0.56), (x + dx, y + 0.35, 0.28), M["walnut"], bevel=0.015,
            rot=(R(8), 0, 0), parent=ch)
    ch.rotation_euler.z = R(rz)
    add_collider(x - 0.48, y - 0.48, x + 0.48, y + 0.48)
    if sit_label:
        # facing direction of the chair after rotation: local -y
        fx, fy = math.sin(R(rz)), -math.cos(R(rz))
        seat(s, sit_label, (x - fx * 0.05, y - fy * 0.05, 1.12), look or (x + fx * 4, y + fy * 4, 1.0))
    return ch


def build_living(M):
    # rug and the L sofa: long run with its back to the kitchen (faces the harbour), the second
    # arm along the west side (faces the TV on the study wall)
    rug = extrude_poly("rug_living", rounded_rect(6.6, 5.6, 0.1), 0.016, (-0.9, 3.0, 0.0), M["rug"])
    rug["uvfit"] = 1
    L, arm_len = 5.6, 3.8
    by = 0.55                                      # back line of the long run (world y)
    # local build: main run along local y [0, L] facing +x; rotate +90 -> faces +y
    def sofa_group(M_):
        root, seats, arm, D = plush_sofa(M_, 0.0, 0.0, L, chaise_len=arm_len)
        # main run seats look at the harbour (local +x), arm seats look at the TV (local -y)
        c, y = seats[len(seats) // 2]
        seat(c, "坐在沙發上看海", (0.55, y, 1.12), (12.0, y, 1.4))
        c2, x2 = arm[len(arm) // 2]
        seat(c2, "坐下看電視", (x2, L - 0.55, 1.12), (x2, L - 9.0, 1.3))
        c3, x3 = arm[-1]
        seat(c3, "躺在沙發上", (x3 + 0.3, L - 0.6, 0.85), (x3 - 2.5, L - 0.6, 1.6), kind="lie")
        return root
    # world = rot90(local) + (x_off, by): rot90 (x,y)->(-y,x); local y in [0,L] -> world x in [-L,0]
    placed(sofa_group, M, rot=90, loc=(1.6, by), name="sofa_group")
    # coffee tables in the corner of the L
    ctx, cty = -0.9, 3.0
    box("coffee_long_top", (1.7, 0.9, 0.06), (ctx, cty, 0.36), M["marble"], bevel=0.015)
    box("coffee_long_base", (1.4, 0.7, 0.3), (ctx, cty, 0.16), M["walnut"], bevel=0.01)
    cylinder("coffee_round_top", 0.42, 0.04, (ctx + 1.4, cty + 0.3, 0.3), M["darkmarble"], segs=64, bevel=0.008)
    cylinder("coffee_round_stem", 0.05, 0.28, (ctx + 1.4, cty + 0.3, 0.14), M["brass"], segs=16)
    add_collider(ctx - 0.86, cty - 0.46, ctx + 1.85, cty + 0.75)
    box("ct_book_a", (0.32, 0.24, 0.04), (ctx - 0.5, cty - 0.15, 0.41), M["book2"], bevel=0.003, rot=(0, 0, R(10)))
    box("ct_book_b", (0.28, 0.21, 0.03), (ctx - 0.49, cty - 0.15, 0.445), M["book1"], bevel=0.003, rot=(0, 0, R(3)))
    cylinder("ct_vase", 0.08, 0.28, (ctx + 0.3, cty + 0.1, 0.53), M["ceramic"], r2=0.05, segs=32)
    for i in range(5):
        a = i * 1.3
        tube(f"ct_branch_{i}", [(ctx + 0.3, cty + 0.1, 0.62), (ctx + 0.3 + 0.08 * math.cos(a), cty + 0.1 + 0.08 * math.sin(a), 0.88),
                                 (ctx + 0.3 + 0.22 * math.cos(a), cty + 0.1 + 0.2 * math.sin(a), 1.08 + 0.05 * i)], 0.006, M["trunk"])
    cylinder("ct_candle", 0.045, 0.1, (ctx + 1.4, cty + 0.3, 0.37), M["ceramic"], segs=24)
    tray = box("ct_tray", (0.4, 0.28, 0.02), (ctx + 0.4, cty - 0.2, 0.4), M["leather"], bevel=0.008)
    del tray
    for k in range(2):
        cylinder(f"ct_cup_{k}", 0.04, 0.08, (ctx + 0.32 + k * 0.15, cty - 0.2, 0.45), M["porcelain"], segs=16)
    # TV wall on the study wall (west face)
    tvx = STUDY_X - WT / 2 - 0.02
    slats = [((0.02, 0.035, H - 0.02), (tvx, 0.4 + i * 0.06, (H - 0.02) / 2)) for i in range(97)]
    multi_box("tv_slats", slats, M["walnut"], group="arch")
    box("tv_slat_back", (0.01, 5.85, H - 0.02), (tvx + 0.012, 3.3, (H - 0.02) / 2), M["blackmetal"], group="arch")
    ty = 3.0
    box("tv_console", (0.44, 3.4, 0.34), (tvx - 0.26, ty, 0.42), M["walnut"], bevel=0.008)
    box("tv_console_shadow", (0.38, 3.3, 0.02), (tvx - 0.24, ty, 0.245), M["blackmetal"])
    add_collider(tvx - 0.5, ty - 1.75, STUDY_X, ty + 1.75)
    box("tv_body", (0.05, 1.9, 1.08), (tvx - 0.05, ty, 1.55), M["tvbody"], bevel=0.004)
    scr = box("tv_screen", (0.006, 1.87, 1.05), (tvx - 0.078, ty, 1.55), M["tvscreen"])
    scr["uvfit"] = "-yz"
    interact(scr, "tv", "電視 · 回憶投影")
    F = Face("-x", tvx - 0.48)
    for k, a0 in enumerate((ty - 1.6, ty + 0.6)):
        F.door(M, f"tv_console_door_{k}", a0, a0 + 1.0, 0.27, 0.58, k == 1, "電視櫃", M["walnut"], angle=95)
    for k, dy in enumerate((-1.25, 1.25)):
        box(f"speaker_{k}", (0.2, 0.18, 0.5), (tvx - 0.28, ty + dy, 0.84), M["tvbody"], bevel=0.02)
    cylinder("console_vase", 0.07, 0.32, (tvx - 0.28, ty - 0.6, 0.75), M["ceramic"], r2=0.03, segs=32)
    sphere("console_orb", 0.1, (tvx - 0.28, ty + 0.6, 0.69), M["darkmarble"])
    # arc lamp behind the sofa corner, side table + lamp
    cylinder("arc_lamp_base", 0.2, 0.05, (-4.75, 0.0, 0.025), M["darkmarble"], segs=48, bevel=0.01)
    pts = [(-4.75 + 1.4 * t, 0.0 + 1.2 * t, 0.05 + 2.1 * math.sin(t * math.pi * 0.62)) for t in [i / 15 for i in range(16)]]
    tube("arc_lamp_stem", pts, 0.012, M["brass"])
    shade = sphere("arc_lamp_shade", 0.2, (-3.35, 1.2, 1.85), M["brass"], scale=(1, 1, 0.55))
    sphere("arc_lamp_bulb", 0.07, (-3.35, 1.2, 1.79), M["bulb"])["lamp_group"] = "arc_lamp"
    interact(shade, "lamp", "落地燈", light="arc_lamp")
    A.point_light("arc_lamp", (-3.35, 1.2, 1.7), 60, (1.0, 0.75, 0.48), 0.1)
    cylinder("side_table", 0.25, 0.03, (2.15, 0.25, 0.55), M["darkmarble"], segs=40, bevel=0.006)
    cylinder("side_table_stem", 0.03, 0.55, (2.15, 0.25, 0.275), M["brass"], segs=16)
    cylinder("side_lamp_base", 0.08, 0.28, (2.15, 0.25, 0.71), M["ceramic"], r2=0.06, segs=32)
    s = cylinder("side_lamp_shade", 0.18, 0.22, (2.15, 0.25, 0.97), M["shade"], r2=0.14, segs=40)
    s["lamp_group"] = "side_lamp"
    interact(s, "lamp", "檯燈", light="side_lamp")
    A.point_light("side_lamp", (2.15, 0.25, 0.94), 30, (1.0, 0.72, 0.45), 0.08)
    add_collider(1.9, 0.0, 2.4, 0.5)
    armchair(M, "lounge_chair_n", 2.9, 6.0, -150, M["leather"], "坐在窗邊", (0.0, 40.0, 0.0))
    A.plant("plant_living_e", (3.6, 6.5), M, 2.2)
    A.plant("plant_living_w", (-5.5, 6.55), M, 2.0)
    # music corner on the suite wall: sideboard with the turntable
    sx = SUITE_X + WT / 2
    sb0, sb1 = 3.95, 6.05
    box("sideboard", (0.46, sb1 - sb0, 0.66), (sx + 0.24, (sb0 + sb1) / 2, 0.37), M["walnut"], bevel=0.006)
    for dy in (-1.0, 1.0):
        box(f"sideboard_leg_{dy}", (0.4, 0.04, 0.04), (sx + 0.24, (sb0 + sb1) / 2 + dy, 0.02), M["brass"])
    add_collider(sx, sb0, sx + 0.5, sb1)
    S = Face("+x", sx + 0.47)
    for k in range(2):
        a0 = sb0 + 0.02 + k * (sb1 - sb0 - 0.04) / 2
        S.door(M, f"sideboard_door_{k}", a0, a0 + (sb1 - sb0 - 0.04) / 2, 0.06, 0.68, k == 1, "唱片櫃", M["walnut"], angle=95)
    tt_y = sb0 + 0.5
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
        box(f"vinyl_sleeve_{k}", (0.31, 0.006, 0.31), (sx + 0.24, sb0 + 1.1 + k * 0.012, 0.86),
            [M["book0"], M["book1"], M["book2"], M["book3"], M["book4"]][k % 5], rot=(R(-4 + k % 3 * 3), 0, 0))
    cylinder("sideboard_lamp_base", 0.07, 0.3, (sx + 0.24, sb1 - 0.3, 0.85), M["ceramic"], r2=0.05, segs=32)
    s = cylinder("sideboard_lamp_shade", 0.16, 0.2, (sx + 0.24, sb1 - 0.3, 1.1), M["shade"], r2=0.12, segs=40)
    s["lamp_group"] = "sideboard_lamp"
    interact(s, "lamp", "檯燈", light="sideboard_lamp")
    A.point_light("sideboard_lamp", (sx + 0.24, sb1 - 0.3, 1.07), 25, (1.0, 0.72, 0.45), 0.08)


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
    rug = extrude_poly("rug_study", rounded_rect(3.6, 4.4, 0.08), 0.014, (7.6, -4.6, 0.0), M["rug2"])
    rug["uvfit"] = 1
    # Big desk, user sits facing the east window; the screen faces the room
    dx, dy = 8.0, -4.6
    box("desk_top", (1.1, 2.8, 0.05), (dx, dy, 0.75), M["walnut"], bevel=0.01)
    box("desk_inlay", (0.6, 1.0, 0.004), (dx + 0.1, dy - 0.6, 0.777), M["leather"])
    F = Face("-x", dx - 0.475, group="study")
    def stationery(root, along, d, z):
        for k in range(3):
            F.box(f"{root.name}_paper_{k}", 0.3, 0.22, 0.01, along, 0.3, z + 0.005 + k * 0.011,
                  M[["paper", "envelope", "paper"][k]], parent=root, group=None)
        F.box(f"{root.name}_pen", 0.01, 0.15, 0.01, along + 0.15, 0.2, z + 0.04, M["brass"], parent=root, group=None)
    for sy in (-1, 1):
        box(f"desk_pedestal_{sy}", (0.95, 0.5, 0.72), (dx, dy + sy * 1.1, 0.36), M["walnut"], bevel=0.006)
        for k in range(3):
            a = dy + sy * 1.1
            F.drawer(M, f"desk_drawer_{sy}_{k}", a - 0.24, a + 0.24, 0.04 + k * 0.23, 0.04 + (k + 1) * 0.23, "書桌抽屜",
                     M["walnut"], depth=0.6, fill=stationery if k == 2 else None)
    add_collider(dx - 0.56, dy - 1.42, dx + 0.56, dy + 1.42)
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
    cx = dx - 0.85
    ch = empty("desk_chair", (cx, dy, 0))
    cs = cushion("desk_chair_seat", (0.52, 0.52, 0.09), (cx, dy, 0.48), M["leather"], puff=0.4, parent=ch)
    cushion("desk_chair_back", (0.07, 0.5, 0.5), (cx - 0.28, dy, 0.82), M["leather"], puff=0.4, rot=(0, R(10), 0), parent=ch)
    cylinder("desk_chair_post", 0.03, 0.42, (cx, dy, 0.24), M["chrome"], segs=16, parent=ch)
    for k in range(5):
        a = k * 2 * math.pi / 5
        box(f"desk_chair_leg_{k}", (0.3, 0.04, 0.03), (cx + 0.15 * math.cos(a), dy + 0.15 * math.sin(a), 0.05), M["chrome"],
            rot=(0, 0, a), parent=ch)
    add_collider(cx - 0.32, dy - 0.32, cx + 0.32, dy + 0.32)
    seat(cs, "坐在書桌前", (cx + 0.05, dy, 1.22), (dx + 0.3, dy, 1.1))
    # library wall on the study's west wall
    bookcase(M, "study_books_w", STUDY_X + WT / 2, -6.9, 6.6, "y", 1, seed=12)
    # file credenza under the east window
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
    # reading lounge in the north half, by the glass
    rug2 = extrude_poly("rug_study_lounge", rounded_rect(4.2, 3.6, 0.1), 0.014, (7.6, 3.6, 0.0), M["rug"])
    rug2["uvfit"] = 1
    armchair(M, "study_reading_chair", 6.4, 4.6, 135, M["leather"], "坐下看書", (12.0, 10.0, 1.0))
    armchair(M, "study_reading_chair_b", 8.8, 4.6, -135, M["boucle"], "坐下看書", (3.0, 10.0, 1.0))
    cylinder("study_side_table", 0.3, 0.03, (7.6, 4.9, 0.5), M["walnut"], segs=40, bevel=0.006)
    cylinder("study_side_stem", 0.04, 0.5, (7.6, 4.9, 0.25), M["brass"], segs=16)
    add_collider(7.3, 4.6, 7.9, 5.2)
    for k in range(3):
        box(f"study_side_book_{k}", (0.24, 0.17, 0.035), (7.6, 4.9, 0.53 + k * 0.036), M[f"book{k + 2}"], bevel=0.003,
            rot=(0, 0, R(9 * k - 6)))
    cylinder("study_lamp_base", 0.15, 0.03, (5.0, 5.6, 0.015), M["blackmetal"], segs=32)
    cylinder("study_lamp_pole", 0.012, 1.45, (5.0, 5.6, 0.74), M["brass"], segs=12)
    s = cylinder("study_lamp_shade", 0.2, 0.3, (5.0, 5.6, 1.55), M["shade"], r2=0.17, segs=40)
    s["lamp_group"] = "study_lamp"
    interact(s, "lamp", "閱讀燈", light="study_lamp")
    A.point_light("study_lamp", (5.0, 5.6, 1.5), 35, (1.0, 0.72, 0.45), 0.1)
    # window daybed
    box("study_daybed_frame", (2.0, 0.85, 0.3), (8.6, 6.25, 0.15), M["walnut"], bevel=0.02)
    pad = cushion("study_daybed_pad", (1.95, 0.8, 0.14), (8.6, 6.25, 0.37), M["plush"], puff=0.35)
    cushion("study_daybed_bolster", (0.3, 0.75, 0.3), (7.7, 6.25, 0.55), M["linen"], puff=0.48)
    add_collider(7.6, 5.82, 9.6, 6.68)
    seat(pad, "躺在窗邊", (7.95, 6.25, 0.85), (11.0, 30.0, 4.0), kind="lie")
    A.plant("plant_study", (10.5, 6.4), M, 1.8)
    A.plant("plant_study_s", (4.65, -9.5), M, 1.6)


def build_travel_wall(M):
    """World map with our routes, a credenza of travel journals, suitcase, globe, passports."""
    wy = YS + 0.07
    mx = 7.4
    m = box("travel_map", (3.4, 0.01, 1.7), (mx, wy + 0.03, 1.85), M["map"], group="study")
    m["uvfit"] = "-xz"
    interact(m, "travel", "旅行地圖 · 我們的行程")
    frame = [((3.5, 0.04, 0.05), (mx, wy + 0.02, 2.72)), ((3.5, 0.04, 0.05), (mx, wy + 0.02, 0.98)),
             ((0.05, 0.04, 1.8), (mx - 1.73, wy + 0.02, 1.85)), ((0.05, 0.04, 1.8), (mx + 1.73, wy + 0.02, 1.85))]
    multi_box("travel_map_frame", frame, M["walnut"], bevel=0.006)
    box("travel_credenza", (2.8, 0.46, 0.7), (mx, wy + 0.24, 0.38), M["walnut"], bevel=0.006)
    F = Face("+y", wy + 0.47, group="study")
    def journals(root, along, d, z):
        for k in range(4):
            F.box(f"{root.name}_j_{k}", 0.18, 0.24, 0.03, along - 0.3 + k * 0.2, 0.2, z + 0.015,
                  M[["leather_tan", "book1", "book3", "leather"][k]], bevel=0.004, parent=root, group=None)
    for k in range(3):
        a0 = mx - 1.38 + k * 0.92
        F.drawer(M, f"travel_drawer_{k}", a0, a0 + 0.9, 0.42, 0.72, "旅行抽屜", M["walnut"], depth=0.42, fill=journals)
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
GARMENTS = {  # length, thickness, [(t, half width)], sleeves, folds
    "jacket": (0.76, 0.06, [(0, 0.22), (0.5, 0.19), (0.88, 0.22), (1, 0.21)], True, 5),
    "shirt": (0.8, 0.04, [(0, 0.21), (0.6, 0.2), (0.9, 0.22), (1, 0.2)], True, 7),
    "coat": (1.12, 0.07, [(0, 0.28), (0.55, 0.22), (0.9, 0.24), (1, 0.22)], True, 6),
    "dress": (1.32, 0.05, [(0, 0.34), (0.55, 0.16), (0.72, 0.14), (0.9, 0.17), (1, 0.15)], False, 9),
    "cocktail": (0.98, 0.05, [(0, 0.26), (0.5, 0.15), (0.72, 0.14), (0.9, 0.17), (1, 0.15)], False, 8),
    "pants": (0.6, 0.04, [(0, 0.18), (1, 0.19)], False, 4),
    "knit": (0.7, 0.07, [(0, 0.24), (0.5, 0.23), (0.9, 0.24), (1, 0.22)], True, 4),
}
GARMENT_NAMES = {"jacket": "西裝外套", "shirt": "襯衫", "coat": "大衣", "dress": "長裙", "cocktail": "小禮服",
                 "pants": "西褲", "knit": "針織衫"}


def garment(name, kind, x, y, top, mat, M, turn=0.0, label=None, seed=0):
    """Hanging garment: a deformed subdivided block with drape folds and creases, sleeves and a
    hanger, grouped under one root so it can be taken off the rail and turned over."""
    length, thick, prof, sleeves, nf = GARMENTS[kind]
    rnd = random.Random(hash(name) & 0xffff)
    root = empty(name, (x, y, top))
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=15, use_grid_fill=True)
    def hw(t):
        for (t0, w0), (t1, w1) in zip(prof[:-1], prof[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0)
                return w0 + (w1 - w0) * (k * k * (3 - 2 * k))
        return prof[-1][1]
    ph1, ph2 = rnd.uniform(0, 6.28), rnd.uniform(0, 6.28)
    for v in bm.verts:
        t = v.co.z + 0.5
        u = v.co.x                      # -0.5..0.5 across
        w = hw(t) * (1 + 0.07 * (1 - t) ** 2)
        side = 1 if v.co.y > 0 else -1
        v.co.x = u * 2 * w
        v.co.y *= thick * (0.6 + 0.4 * (1 - abs(u) * 2))
        # drape folds: vertical ripples, deeper towards the hem, plus a few diagonal creases
        fold = math.sin(u * math.pi * nf + ph1 + 0.6 * math.sin(t * 4)) * (0.006 + 0.014 * (1 - t) ** 1.5)
        crease = 0.004 * math.sin(u * 23 + t * 17 + ph2) * math.exp(-((t - 0.45) / 0.18) ** 2)
        v.co.y += fold + crease * side
        v.co.z = top - 0.06 - (1 - t) * length + 0.006 * math.sin(u * 9 + ph2) * (1 - t)
        if t > 0.9:   # sloping shoulders
            v.co.z -= abs(v.co.x) * 0.35 * (t - 0.9) / 0.1
    bmesh.ops.translate(bm, vec=(x, y, 0), verts=bm.verts)
    if turn:
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(x, y, 0), matrix=Matrix.Rotation(turn, 3, "Z"))
    lib._finish(f"{name}_body", bm, mat, group="suite", parent=root, angle=70)
    c, s = math.cos(turn), math.sin(turn)
    if sleeves:
        sw = prof[-2][1] - 0.01
        for s_ in (-1, 1):
            sx, sy = x + s_ * sw * c, y + s_ * sw * s
            L = length * (0.78 if kind != "knit" else 0.7)
            pts = [(sx, sy, top - 0.1), (sx + s_ * 0.02 * c, sy + s_ * 0.02 * s, top - 0.1 - L * 0.45),
                   (sx + s_ * 0.012 * c + 0.01 * s, sy + s_ * 0.012 * s, top - 0.1 - L * 0.55),
                   (sx + s_ * 0.03 * c, sy + s_ * 0.03 * s, top - 0.1 - L)]
            tube(f"{name}_sleeve_{s_}", pts, 0.036 if kind != "knit" else 0.045, mat, parent=root, group="suite")
            cylinder(f"{name}_cuff_{s_}", 0.04 if kind != "knit" else 0.047, 0.05, pts[-1], mat, segs=12, parent=root, group="suite")
    if kind in ("jacket", "coat"):
        for s_ in (-1, 1):   # lapels
            box(f"{name}_lapel_{s_}", (0.07, 0.01, 0.26), (x + s_ * 0.06 * c, y + s_ * 0.06 * s - thick * 0.6 * c, top - 0.25),
                mat, rot=(0, R(s_ * 12), turn), parent=root, group="suite")
        for k in range(2):
            sphere(f"{name}_button_{k}", 0.012, (x - thick * 0.62 * s, y - thick * 0.62 * c, top - 0.45 - k * 0.1),
                   M["blackmetal"], segs=8, parent=root, group="suite")
    if kind == "shirt":
        box(f"{name}_collar", (0.16, 0.06, 0.05), (x, y, top - 0.08), mat, bevel=0.01, rot=(0, 0, turn), parent=root,
            group="suite")
    dxh, dyh = 0.2 * c, 0.2 * s
    tube(f"{name}_hanger", [(x - dxh, y - dyh, top - 0.07), (x, y, top - 0.02), (x + dxh, y + dyh, top - 0.07)],
         0.006, M["walnut"], parent=root, group="suite")
    tube(f"{name}_hook", [(x, y, top - 0.02), (x, y, top + 0.03)], 0.003, M["brass"], parent=root, group="suite")
    interact(root, "garment", label or GARMENT_NAMES[kind])
    return root


def wardrobe_run(M, name, axis, line, a0, a1, facing, garments, boxes, label, owner, glass=True, depth=0.62, height=2.9):
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
    box(f"{name}_bulkhead", *P((L, depth, H - height), L / 2, depth / 2, (H + height) / 2), M["plaster"], group="arch")
    leds = [P((L - 0.1, 0.03, 0.008), L / 2, depth - 0.08, 2.29)]
    multi_box(f"{name}_led", leds, M["ledstrip"], group=None)
    cpos = P((L, depth, 0), L / 2, depth / 2, 2.25)[1]
    A.area_light(f"{name}_led", cpos, ((0.1, L - 0.2) if axis == "y" else (L - 0.2, 0.1)), 30, (1.0, 0.86, 0.68))
    rail = [P((0, 0, 0), 0.05, depth * 0.5, 2.2)[1], P((0, 0, 0), L - 0.05, depth * 0.5, 2.2)[1]]
    tube(f"{name}_rail", rail, 0.012, M["brass"], group="suite")
    n = len(garments)
    for i, (kind, gm) in enumerate(garments):
        along = 0.15 + (L - 0.3) * (i + 0.5) / n
        gx, gy, _ = P((0, 0, 0), along, depth * 0.5, 0)[1]
        garment(f"{name}_g{i}", kind, gx, gy, 2.2, M[gm], M, turn=(0 if axis == "y" else math.pi / 2),
                label=f"{owner}的{GARMENT_NAMES[kind]}")
    for i, b in enumerate(boxes):
        along = 0.25 + (L - 0.5) * (i + 0.5) / len(boxes)
        sz = (0.42, 0.34, 0.22) if i % 2 else (0.36, 0.3, 0.16)
        bx = box(f"{name}_box{i}", P(sz, along, depth * 0.45, 2.34 + sz[2] / 2)[0], P(sz, along, depth * 0.45, 2.34 + sz[2] / 2)[1],
                 M[f"brand_{b}"], bevel=0.004, group="suite")
        bx["uvfit"] = ("-yz" if facing > 0 else "yz") if axis == "y" else ("xz" if facing > 0 else "-xz")
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
    root = empty(name, (x, y, z))
    if kind == "birkin":
        box(f"{name}_body", (0.32, 0.17, 0.24), (x, y, z + 0.12), mat, bevel=0.03, group="suite", rot=(0, 0, turn), parent=root)
        box(f"{name}_flap", (0.33, 0.175, 0.06), (x, y, z + 0.22), mat, bevel=0.02, group="suite", rot=(0, 0, turn), parent=root)
        for s_ in (-1, 1):
            tube(f"{name}_handle_{s_}", [(x - 0.07, y + s_ * 0.03, z + 0.24), (x - 0.05, y + s_ * 0.03, z + 0.34),
                                         (x + 0.05, y + s_ * 0.03, z + 0.34), (x + 0.07, y + s_ * 0.03, z + 0.24)],
                 0.008, mat, group="suite", parent=root)
        box(f"{name}_lock", (0.03, 0.18, 0.03), (x, y, z + 0.2), M["gold"], bevel=0.005, group="suite", parent=root)
    else:  # quilted flap bag on a chain
        box(f"{name}_body", (0.26, 0.08, 0.16), (x, y, z + 0.08), mat, bevel=0.02, group="suite", parent=root)
        box(f"{name}_turnlock", (0.03, 0.085, 0.02), (x, y, z + 0.12), M["gold"], bevel=0.004, group="suite", parent=root)
        tube(f"{name}_chain", [(x - 0.1, y, z + 0.16), (x - 0.06, y, z + 0.3), (x + 0.06, y, z + 0.3), (x + 0.1, y, z + 0.16)],
             0.004, M["gold"], group="suite", parent=root)
    interact(root, "garment", "手袋")
    return root


def build_closet(M):
    """U-shaped walk-in closet opening east onto the suite walkway: hers along the bedroom
    wall, his along the bathroom wall, a bags & shoes display on the west wall, island."""
    d = 0.62
    ys0 = CLOSET_Y                  # her run back line (faces north)
    yn0 = BATH_Y - WT / 2           # his run back line (faces south)
    hers = [("dress", "silk_black"), ("dress", "silk_champagne"), ("cocktail", "silk_red"), ("dress", "silk_emerald"),
            ("cocktail", "silk_blush"), ("jacket", "tweed"), ("jacket", "tweed"), ("coat", "trench"),
            ("shirt", "silk_ivory"), ("cocktail", "silk_black"), ("dress", "silk_ivory"), ("knit", "knit_cream"),
            ("coat", "wool_camel"), ("shirt", "silk_blush"), ("knit", "knit_grey")]
    wardrobe_run(M, "her_wardrobe", "x", ys0, XW + 0.02, CLOSET_X, 1, hers,
                 ["chanel", "dior", "hermes", "chanel", "dior", "hermes", "chanel"], "衣櫃 · 她的", "她")
    his = [("jacket", "wool_navy"), ("jacket", "wool_char"), ("jacket", "wool_navy"), ("shirt", "shirt_white"),
           ("shirt", "shirt_white"), ("shirt", "shirt_blue"), ("shirt", "shirt_blue"), ("coat", "wool_camel"),
           ("coat", "wool_char"), ("pants", "wool_navy"), ("pants", "wool_char"), ("jacket", "silk_black"),
           ("knit", "knit_grey"), ("knit", "knit_cream"), ("pants", "denim")]
    wardrobe_run(M, "his_wardrobe", "x", yn0, XW + 0.02, CLOSET_X, -1, his,
                 ["tomford", "loropiana", "tomford", "loropiana", "hermes", "tomford", "loropiana"], "衣櫃 · 他的", "他")
    # bags & shoes display on the west wall, open lit shelves
    a0, a1 = ys0 + d + 0.02, yn0 - d - 0.02
    L = a1 - a0
    xw = XW
    parts = [((0.42, L, 0.03), (xw + 0.21, (a0 + a1) / 2, z)) for z in (0.12, 0.45, 0.9, 1.4, 1.9, 2.4)]
    parts += [((0.42, 0.03, 2.5), (xw + 0.21, a0 + i * L / 4, 1.25)) for i in range(5)]
    parts.append(((0.015, L, 2.6), (xw + 0.008, (a0 + a1) / 2, 1.3)))
    multi_box("display_case", parts, M["walnut"], bevel=0.003, group="suite")
    multi_box("display_leds", [((0.02, L - 0.1, 0.006), (xw + 0.36, (a0 + a1) / 2, z - 0.02)) for z in (0.9, 1.4, 1.9, 2.4)],
              M["ledstrip"], group=None)
    A.area_light("display_led", (xw + 0.32, (a0 + a1) / 2, 1.5), (0.2, L - 0.2), 30, (1.0, 0.86, 0.68), rot=(0, R(30), 0))
    add_collider(xw, a0, xw + 0.44, a1)
    bagmats = ["bag_orange", "bag_black", "bag_etoupe", "bag_orange", "bag_black", "leather_tan", "bag_etoupe", "bag_black"]
    for i in range(8):
        by_ = a0 + L * (i % 4 + 0.5) / 4
        z = 1.415 if i < 4 else 1.915
        bag(f"bag_{i}", xw + 0.21, by_, z, M[bagmats[i]], M, kind="birkin" if i % 3 != 1 else "flap", turn=math.pi / 2)
    for i in range(4):
        bx_ = box(f"display_box_{i}", (0.3, 0.4, 0.26), (xw + 0.21, a0 + L * (i + 0.5) / 4, 2.545),
                  M[f"brand_{['hermes', 'chanel', 'dior', 'cartier'][i]}"], bevel=0.004, group="suite")
        bx_["uvfit"] = "-yz"
    shoes = [(0.03, 0.03, 0.03), (0.6, 0.05, 0.06), (0.86, 0.75, 0.62), (0.05, 0.05, 0.05), (0.42, 0.24, 0.12),
             (0.9, 0.88, 0.86), (0.25, 0.08, 0.06), (0.03, 0.03, 0.03)]
    for i, col in enumerate(shoes):
        m_ = material(f"shoe_c{i}", color=col, rough=0.35, coat=0.4)
        for row, z in enumerate((0.135, 0.465, 0.915)):
            if row == 2 and i > 3:
                continue
            for s_ in (-1, 1):
                sy = a0 + L * (i + 0.5) / 8 + s_ * 0.05
                if row == 0:
                    cushion(f"shoe_{i}_{row}_{s_}", (0.28, 0.09, 0.08), (xw + 0.21, sy, z + 0.045), m_, puff=0.45, group="suite")
                else:
                    cushion(f"shoe_{i}_{row}_{s_}", (0.22, 0.07, 0.05), (xw + 0.24, sy, z + 0.07), m_, puff=0.45,
                            rot=(0, R(18), 0), group="suite")
                    cylinder(f"heel_{i}_{row}_{s_}", 0.006, 0.08, (xw + 0.13, sy, z + 0.04), m_, segs=8, group="suite")
    # island: walnut with a glass top over velvet trays of watches and jewellery; drawers both sides
    ix, iy = -11.4, (ys0 + d + yn0 - d) / 2
    iw, idp = 2.6, 0.95
    box("island_closet", (iw, idp, 0.88), (ix, iy, 0.44), M["walnut"], bevel=0.006, group="suite")
    box("island_closet_tray", (iw - 0.1, idp - 0.1, 0.01), (ix, iy, 0.865), M["velvet_tray"], group="suite")
    g = box("island_closet_glass", (iw, idp, 0.012), (ix, iy, 0.9), M["glass"], group=None)
    g["glass"] = 1
    for k in range(6):
        wx = ix - 0.9 + k * 0.17
        cylinder(f"watch_{k}", 0.022, 0.01, (wx, iy - 0.2, 0.876), M["gold"] if k % 2 else M["chrome"], segs=24)
        cylinder(f"watch_face_{k}", 0.019, 0.002, (wx, iy - 0.2, 0.882), M["satin"] if k % 3 else M["tvscreen"], segs=24)
        box(f"watch_band_{k}", (0.02, 0.18, 0.004), (wx, iy - 0.2, 0.872), M["leather"] if k % 2 else M["chrome"])
    for k in range(5):
        tube(f"ring_{k}", [(ix + 0.2 + k * 0.12 + 0.01 * math.cos(a * math.pi / 6), iy + 0.15 + 0.01 * math.sin(a * math.pi / 6), 0.875)
                          for a in range(13)], 0.002, M["gold"])
    tube("necklace", [(ix - 0.3 + 0.15 * math.cos(a * math.pi / 12), iy + 0.15 + 0.1 * math.sin(a * math.pi / 12), 0.872)
                      for a in range(25)], 0.0025, M["gold"])
    for k in range(3):
        bx_ = box(f"cartier_box_{k}", (0.12, 0.12, 0.07), (ix + 0.7 + k * 0.15, iy - 0.25, 0.94), M["brand_cartier"],
                  bevel=0.01, rot=(0, 0, R(10 * k)))
        bx_["uvfit"] = "xy"
    for side, facing in ((-1, "-y"), (1, "+y")):
        F = Face(facing, iy + side * idp / 2, group="suite")
        def folded(root, along, dd, z, side=side, F=F):
            for k in range(3):
                F.box(f"{root.name}_tee_{k}", 0.22, 0.28, 0.035, along - 0.25 + k * 0.25, 0.25, z + 0.018,
                      M[["knit_cream", "shirt_white", "knit_grey"][k]], bevel=0.01, parent=root, group=None)
        for k in range(3):
            a0_ = ix - iw / 2 + 0.05 + k * (iw - 0.1) / 3
            F.drawer(M, f"closet_drawer_{side}_{k}", a0_, a0_ + (iw - 0.1) / 3, 0.1, 0.5, "衣帽間抽屜", M["walnut"], depth=0.42,
                     fill=folded)
    cylinder("closet_vase", 0.07, 0.3, (ix - 1.05, iy + 0.25, 1.06), M["ceramic"], r2=0.05, segs=32)
    for k in range(7):
        sphere(f"closet_peony_{k}", 0.045, (ix - 1.05 + 0.05 * math.cos(k), iy + 0.25 + 0.05 * math.sin(k), 1.25 + 0.03 * (k % 2)),
               material("peony", color=(0.95, 0.75, 0.78), rough=0.6, sheen=0.5), segs=12)
    add_collider(ix - iw / 2 - 0.02, iy - idp / 2, ix + iw / 2 + 0.02, iy + idp / 2)
    # full-length mirror on the suite wall facing the closet, ottoman
    mx = SUITE_X - WT / 2 - 0.03
    box("closet_mirror", (0.02, 0.9, 1.95), (mx, -1.2, 1.05), M["mirror"])
    box("closet_mirror_frame", (0.03, 0.96, 2.02), (mx + 0.005, -1.2, 1.05), M["brass"], bevel=0.005)
    ot = cushion("closet_ottoman", (0.7, 0.7, 0.42), (-9.2, iy, 0.21), M["velvet"], puff=0.4)
    add_collider(-9.55, iy - 0.35, -8.85, iy + 0.35)
    seat(ot, "坐下", (-9.2, iy, 1.1), (-13.0, iy, 1.3))
    A.pendant_globe("closet_pendant", (ix, iy, 2.3), M)


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
    duvet = cushion("bed_duvet", (1.6, 2.05, 0.16), (bx + 0.32, by, 0.72), M["duvet"], puff=0.45, parent=bed)
    cushion("bed_duvet_fold", (0.3, 2.06, 0.1), (bx - 0.45, by, 0.78), M["duvet"], puff=0.45, parent=bed)
    cushion("bed_throw", (0.55, 2.1, 0.06), (bx + 0.85, by, 0.82), M["linen"], puff=0.45, parent=bed)
    pillows = []
    for i, dy in enumerate((-0.48, 0.48)):
        p = cushion(f"bed_pillow_{i}", (0.22, 0.75, 0.44), (0.45, by + dy, 0.88), M["duvet"], puff=0.48, rot=(0, R(-22), 0),
                    parent=bed)
        pillows.append(p)
        cushion(f"bed_pillow_front_{i}", (0.16, 0.6, 0.38), (0.6, by + dy, 0.86), M["linen"], puff=0.48, rot=(0, R(-18), 0),
                parent=bed)
    cushion("bed_bolster", (0.2, 0.9, 0.26), (0.78, by, 0.83), M["velvet"], puff=0.48, parent=bed)
    add_collider(0, by - 1.05, bx + 1.12, by + 1.05)
    # lie / sleep (the duvet and a pillow are the handles)
    seat(duvet, "躺在床上", (0.75, by - 0.45, 1.0), (3.4, by - 0.45, 1.9), kind="lie")
    seat(pillows[1], "睡覺", (0.62, by + 0.45, 0.95), (3.4, by + 0.2, 2.4), kind="sleep")
    gx = bx + 1.55
    bench = cushion("bed_bench_pad", (0.46, 1.6, 0.12), (gx, by, 0.46), M["leather"], puff=0.4)
    for dy in (-0.7, 0.7):
        box(f"bed_bench_leg_{dy}", (0.44, 0.04, 0.4), (gx, by + dy, 0.2), M["brass"])
    add_collider(gx - 0.24, by - 0.82, gx + 0.24, by + 0.82)
    seat(bench, "坐在床尾", (gx + 0.05, by - 0.4, 1.1), (gx + 4.0, by - 0.4, 1.2))
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
        box(f"nightstand_{i}", (0.5, 0.55, 0.3), (0.3, y, 0.17), M["walnut"], bevel=0.01)
        box(f"nightstand_{i}_top", (0.52, 0.57, 0.03), (0.3, y, 0.565), M["walnut"], bevel=0.006)
        F = Face("+x", 0.55, group="suite")
        def bits(root, along, dd, z, i=i, F=F):
            F.box(f"{root.name}_book", 0.15, 0.22, 0.03, along - 0.1, 0.22, z + 0.015, M["book3"], bevel=0.004, parent=root,
                  group=None)
            cylinder(f"{root.name}_cream", 0.025, 0.08, F.p(along + 0.12, 0.15, z + 0.04), M["porcelain"], segs=12,
                     parent=root, group=None)
            box(f"{root.name}_glasses", F.s(0.13, 0.05, 0.015), F.p(along + 0.1, 0.3, z + 0.01), M["blackmetal"],
                parent=root, group=None)
        F.drawer(M, f"nightstand_{i}_drawer", y - 0.26, y + 0.26, 0.32, 0.55, "床頭櫃抽屜", M["walnut"], depth=0.46, fill=bits)
        add_collider(0, y - 0.28, 0.56, y + 0.28)
        cylinder(f"bed_lamp_{i}_base", 0.07, 0.32, (0.28, y, 0.74), M["ceramic"], r2=0.05, segs=32)
        s = cylinder(f"bed_lamp_{i}_shade", 0.17, 0.22, (0.28, y, 1.01), M["shade"], r2=0.13, segs=40)
        interact(s, "lamp", "床頭燈", light=f"bed_lamp_{i}")
        s["lamp_group"] = f"bed_lamp_{i}"
        A.point_light(f"bed_lamp_{i}", (0.28, y, 0.98), 30, (1.0, 0.72, 0.45), 0.08)
    box("bed_art", (0.04, 2.2, 0.8), (0.02, by, 2.3), M["linen"], bevel=0.01)


def build_bedroom(M):
    # headboard on the west wall, the window to the south, three sides free
    placed(bed_group, M, rot=0, loc=(XW, -6.3), name="bed_group")
    # keepsake vitrine on the south wall east of the window, letter wall on the closet wall
    placed(A.build_vitrine, M, rot=-90, loc=(-8.6 - 2.4, YS + 0.07 - 1.27), name="vitrine_group")
    placed(A.build_letter_wall, M, 0.0, rot=180, loc=(-11.4 - 3.35, CLOSET_Y - WT - 0.01), name="letter_group")
    armchair(M, "bed_lounge_a", -13.4, -9.1, 0, M["boucle"], "坐在窗邊", (-13.4, -30, 0.5))
    armchair(M, "bed_lounge_b", -11.6, -9.1, 0, M["boucle"], "坐在窗邊", (-11.6, -30, 0.5))
    cylinder("bed_lounge_table", 0.25, 0.03, (-12.5, -9.25, 0.5), M["darkmarble"], segs=40, bevel=0.006)
    cylinder("bed_lounge_stem", 0.03, 0.5, (-12.5, -9.25, 0.25), M["brass"], segs=16)
    add_collider(-12.75, -9.5, -12.25, -9.0)
    A.plant("plant_bed", (-6.55, -9.45), M, 1.8)
    # her dressing table on the suite wall (bedroom side)
    vx = SUITE_X - WT / 2
    vy = -5.6
    box("dressing_top", (0.5, 1.3, 0.04), (vx - 0.25, vy, 0.76), M["walnut"], bevel=0.008)
    F = Face("-x", vx - 0.5, group="suite")
    def makeup(root, along, dd, z):
        for k in range(6):
            cylinder(f"{root.name}_lip_{k}", 0.01, 0.07, F.p(along - 0.25 + k * 0.1, 0.2, z + 0.035),
                     M[["gold", "bag_black", "gold", "silk_red", "gold", "silk_blush"][k]], segs=10, parent=root, group=None)
        F.box(f"{root.name}_palette", 0.14, 0.1, 0.012, along + 0.2, 0.3, z + 0.006, M["bag_black"], parent=root, group=None)
    F.drawer(M, "dressing_drawer", vy - 0.6, vy + 0.6, 0.62, 0.74, "梳妝台抽屜", M["walnut"], depth=0.44, fill=makeup)
    for dy in (-0.6, 0.6):
        box(f"dressing_leg_{dy}", (0.45, 0.03, 0.62), (vx - 0.25, vy + dy, 0.31), M["brass"])
    add_collider(vx - 0.5, vy - 0.66, vx, vy + 0.66)
    cylinder("dressing_mirror", 0.4, 0.02, (vx - 0.012, vy, 1.45), M["mirror"], segs=64, rot=(0, R(90), 0))
    cylinder("dressing_mirror_frame", 0.42, 0.015, (vx - 0.006, vy, 1.45), M["brass"], segs=64, rot=(0, R(90), 0))
    for k, (dy, mat) in enumerate(((-0.4, "f_jam"), (-0.3, "clear_glass"), (0.35, "silk_blush"))):
        cylinder(f"dressing_bottle_{k}", 0.03, 0.12, (vx - 0.2, vy + dy, 0.84), M[mat], segs=16)
    ds = cushion("dressing_stool", (0.42, 0.42, 0.1), (vx - 0.8, vy, 0.46), M["velvet"], puff=0.45)
    for a in range(4):
        ang = a * math.pi / 2 + math.pi / 4
        box(f"dressing_stool_leg_{a}", (0.025, 0.025, 0.42), (vx - 0.8 + 0.14 * math.cos(ang), vy + 0.14 * math.sin(ang), 0.21),
            M["brass"])
    add_collider(vx - 1.02, vy - 0.22, vx - 0.58, vy + 0.22)
    seat(ds, "坐在梳妝台前", (vx - 0.85, vy, 1.15), (vx, vy, 1.4))


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
    sx_ = SUITE_X - WT / 2
    cl = [((abs(sx_ - XW), 0.02, H), ((XW + sx_) / 2, BATH_Y + WT / 2 + 0.011, H / 2)),
          ((0.02, YN - BATH_Y - 0.5, H), (sx_ - 0.011, (BATH_Y + YN) / 2, H / 2))]
    multi_box("bath_cladding", cl, M["bath_stone"], group="arch")
    # freestanding tub at the harbour glass
    tx, ty = -10.3, 5.85
    tub = bathtub("bathtub", tx, ty, 1.8, 0.85, 0.6, M["porcelain"])
    water = extrude_poly("bath_water", [(tx + 0.75 * math.cos(2 * math.pi * i / 40), ty + 0.32 * math.sin(2 * math.pi * i / 40))
                                        for i in range(40)], 0.005, (0, 0, 0.42), M["water"], group=None)
    water["bathwater"] = 1
    interact(tub, "bath", "浴缸 · 放水")
    add_collider(tx - 0.95, ty - 0.48, tx + 0.95, ty + 0.48)
    fx = tx - 1.15
    tube("tub_filler", [(fx, ty, 0.0), (fx, ty, 0.95), (fx + 0.08, ty, 1.02), (fx + 0.22, ty, 0.98)], 0.018, M["brass"])
    empty("tub_spout", (fx + 0.22, ty, 0.95))
    tray = box("tub_tray", (0.22, 0.95, 0.025), (tx + 0.2, ty, 0.62), M["walnut"], bevel=0.006)
    seat(tray, "泡澡", (tx + 0.35, ty, 0.95), (tx - 3.0, ty + 3.0, 1.6), kind="lie")
    cylinder("tub_candle", 0.04, 0.08, (tx + 0.2, ty - 0.25, 0.672), M["ceramic"], segs=24)
    box("tub_book", (0.15, 0.2, 0.02), (tx + 0.2, ty + 0.2, 0.643), M["book3"], bevel=0.003)
    cushion("tub_towel", (0.35, 0.5, 0.1), (tx + 1.3, ty - 0.3, 0.5), M["towel"], puff=0.45)
    cylinder("tub_stool", 0.2, 0.45, (tx + 1.3, ty - 0.3, 0.225), M["walnut"], segs=32)
    A.pendant_globe("tub_pendant", (tx, ty, 2.4), M)
    # double vanity on the bathroom side of the closet wall, drawers
    vy = BATH_Y + WT / 2
    v0, v1 = -12.0, -8.5
    box("vanity_cabinet", (v1 - v0, 0.55, 0.12), ((v0 + v1) / 2, vy + 0.28, 0.79), M["walnut"], bevel=0.006)
    box("vanity_top", (v1 - v0 + 0.04, 0.58, 0.04), ((v0 + v1) / 2, vy + 0.29, 0.87), M["marble"], bevel=0.004)
    add_collider(v0, vy, v1, vy + 0.6)
    F = Face("+y", vy + 0.55, group="suite")
    def toiletries(root, along, dd, z):
        for k in range(5):
            cylinder(f"{root.name}_tube_{k}", 0.018, 0.14, F.p(along - 0.3 + k * 0.12, 0.25, z + 0.02),
                     M[["porcelain", "f_label_blue", "silk_blush", "porcelain", "f_lemon"][k]], segs=10,
                     rot=(R(90), 0, 0) if not F.xf else (0, R(90), 0), parent=root, group=None)
    for k in range(2):
        a0 = v0 + 0.05 + k * (v1 - v0 - 0.1) / 2
        F.drawer(M, f"vanity_drawer_{k}", a0, a0 + (v1 - v0 - 0.1) / 2, 0.38, 0.72, "浴室抽屜", M["walnut"], depth=0.48,
                 fill=toiletries)
        box(f"vanity_drawer_carcass_{k}", F.s((v1 - v0 - 0.1) / 2, 0.53, 0.34), F.p(a0 + (v1 - v0 - 0.1) / 4, 0.265, 0.55),
            M["walnut"], group="suite")
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
    # his-and-hers toothbrush cups
    for k, (x, col) in enumerate(((v0 + 1.5, "f_label_blue"), (v1 - 1.5, "silk_blush"))):
        cylinder(f"tooth_cup_{k}", 0.035, 0.1, (x, vy + 0.12, 0.94), M["clear_glass"], segs=16, group=None)
        tube(f"toothbrush_{k}", [(x, vy + 0.12, 0.9), (x + 0.02, vy + 0.13, 1.08)], 0.006, M[col])
    # walk-in shower at the west end behind a glass screen
    gx = -13.0
    g = box("shower_glass", (0.012, YN - 3.6 - 0.1, 2.2), (gx, (3.6 + YN - 0.1) / 2, 1.12), M["rail_glass"], group=None)
    g["glass"] = 1
    box("shower_glass_rail", (0.03, YN - 3.6 - 0.1, 0.03), (gx, (3.6 + YN - 0.1) / 2, 2.24), M["brass"])
    add_collider(gx - 0.03, 3.6, gx + 0.03, YN)
    cylinder("rain_head", 0.17, 0.012, (-14.0, 5.3, 2.4), M["brass"], segs=48)
    tube("rain_arm", [(-14.0, BATH_Y + WT / 2 + 0.02, 2.55), (-14.0, 5.3, 2.55), (-14.0, 5.3, 2.41)], 0.012, M["brass"])
    empty("shower_spout", (-14.0, 5.3, 2.38))
    mixer = cylinder("shower_mixer", 0.05, 0.03, (-14.2, BATH_Y + WT / 2 + 0.015, 1.1), M["brass"], segs=24, rot=(R(90), 0, 0))
    interact(mixer, "shower", "花灑 · 淋浴", spout="shower_spout")
    box("shower_drain", (1.6, 0.05, 0.003), (-14.0, 4.0, 0.002), M["brass"])
    box("shower_niche", (0.6, 0.12, 0.3), (-14.0, BATH_Y + WT / 2 + 0.06, 1.3), M["marble"])
    for k in range(3):
        cylinder(f"shower_bottle_{k}", 0.03, 0.2, (-14.2 + k * 0.15, BATH_Y + WT / 2 + 0.07, 1.25), M[["porcelain", "f_label_blue",
                                                                                                         "silk_blush"][k]], segs=12)
    # WC behind frosted glass in the north-east corner
    wcx0, wcy0 = -7.6, 5.2
    gw = box("wc_glass_w", (0.02, YN - 0.2 - wcy0, 2.2), (wcx0, (wcy0 + YN - 0.2) / 2, 1.1), M["glass_frost"], group=None)
    gw["glass"] = 1
    gs = box("wc_glass_s", (0.7, 0.02, 2.2), (wcx0 + 0.35, wcy0, 1.1), M["glass_frost"], group=None)
    gs["glass"] = 1
    add_collider(wcx0 - 0.03, wcy0, wcx0 + 0.03, YN - 0.2)
    add_collider(wcx0, wcy0 - 0.03, wcx0 + 0.7, wcy0 + 0.03)
    box("wc_cistern", (0.18, 0.5, 0.9), (sx_ - 0.1, 6.1, 0.6), M["bath_stone"])
    cushion("wc_bowl", (0.55, 0.38, 0.32), (sx_ - 0.45, 6.1, 0.4), M["porcelain"], puff=0.45)
    box("wc_flush", (0.01, 0.2, 0.12), (sx_ - 0.191, 6.1, 1.1), M["brass"])
    add_collider(sx_ - 0.75, 5.8, sx_, 6.4)
    # towel ladder + plant
    for z in (0.4, 0.8, 1.2, 1.6):
        tube(f"towel_bar_{z}", [(sx_ - 0.06, 4.2, z), (sx_ - 0.06, 4.9, z)], 0.012, M["brass"])
    for s_ in (4.2, 4.9):
        tube(f"towel_rail_{s_}", [(sx_ - 0.06, s_, 0.2), (sx_ - 0.06, s_, 1.8)], 0.012, M["brass"])
    cushion("towel_hanging", (0.06, 0.55, 0.7), (sx_ - 0.09, 4.55, 1.3), M["towel"], puff=0.45)
    A.plant("plant_bath", (-12.35, 6.55), M, 1.4)


# ---------------------------------------------------------------------------
def build_ceiling_lights(M):
    spots = [(-4.5, -9.05), (-2.0, -9.05), (0.5, -9.05), (2.5, -8.2), (2.5, -6.6), (2.5, -4.8),   # corridor / hall
             (-4.6, -6.3), (-2.6, -6.3), (-0.6, -6.3), (-5.0, -2.6), (2.5, -2.6),                 # kitchen / dining
             (-5.0, -0.4), (2.9, -0.6), (-5.0, 5.9), (2.9, 6.0), (-1.0, 6.1), (3.2, 3.0),        # living
             (-12.0, -8.6), (-12.0, -4.1), (-9.4, -8.6), (-9.4, -5.0), (-7.1, -7.0), (-7.1, -3.8),  # bedroom
             (-7.1, -1.0), (-7.1, 1.3),                                                          # walkway
             (-13.6, -1.4), (-13.6, 0.9), (-9.6, -1.4), (-9.6, 0.9),                            # closet
             (-14.0, 4.0), (-14.0, 6.1), (-11.6, 3.2), (-9.0, 3.6), (-7.0, 3.3), (-6.8, 6.1),   # bathroom
             (5.4, -8.6), (7.6, -8.4), (10.0, -8.6), (5.4, -5.5), (10.0, -5.5), (5.4, -2.2), (10.0, -2.2),
             (5.4, 1.4), (7.6, 1.4), (10.0, 1.4), (5.4, 4.4), (10.0, 4.4)]                       # study
    discs = []
    for i, (x, y) in enumerate(spots):
        discs.append(((0.09, 0.09, 0.006), (x, y, H - 0.002)))
        A.spot(f"downlight_{i}", (x, y, H - 0.02), 32)
    multi_box("downlights", discs, M["downlight"], group=None)
    for y in (-0.5, 6.2):
        A.area_light(f"slot_living_{y}", (-1.2, y, H - 0.03), (7.5, 0.05), 140, (1.0, 0.82, 0.62))
    A.area_light("slot_kitchen", (-2.5, -7.7, H - 0.03), (5.9, 0.05), 70, (1.0, 0.84, 0.66))
    A.area_light("slot_study", (7.6, -2.5, H - 0.03), (0.05, 14.4), 160, (1.0, 0.84, 0.66))


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
    build_living(M)
    build_study(M)
    build_closet(M)
    build_bedroom(M)
    build_bathroom(M)
    build_ceiling_lights(M)
    return M
