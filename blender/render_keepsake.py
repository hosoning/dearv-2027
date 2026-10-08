"""Product shots of a vitrine keepsake (used as book pages until real photos arrive).

    python blender/render_keepsake.py --index 0 --out web/public/content/pajamas
"""
import argparse
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import apartment  # noqa: E402
import lib  # noqa: E402
from main import apply_uvs  # noqa: E402


def look_at(cam, target):
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", type=int, nargs="+", default=[0])
    ap.add_argument("--out", required=True, help="output prefix; _<index>_<shot>.webp is appended")
    ap.add_argument("--tex", default=os.path.join(HERE, "..", "build", "textures"))
    ap.add_argument("--samples", type=int, default=96)
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    lib.TEX_DIR = os.path.abspath(a.tex)
    lib.reset_scene()
    apartment.build()
    apply_uvs()
    bpy.context.view_layer.update()
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = a.samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 800, 1000
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.exposure = -1.1
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.95, 0.9, 0.86, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3
    studio = material_backdrop()
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    for idx in a.index:
        root = bpy.data.objects[f"keepsake_{idx}"]
        keep = set(root.children_recursive) | {root}
        for o in bpy.data.objects:
            if o.type in ("MESH", "CURVE"):
                o.hide_render = o not in keep or bool(o.get("snowbox"))
        pts = [o.matrix_world @ Vector(b) for o in keep if o.type == "MESH" for b in o.bound_box]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        c = (lo + hi) / 2
        size = (hi - lo).length
        studio.location = (c.x, c.y, lo.z - 0.0005)
        studio.scale = (size * 6,) * 3
        studio.hide_render = False
        for nm in ("key", "fill", "rim"):
            if nm in bpy.data.objects:
                bpy.data.objects.remove(bpy.data.objects[nm])
        for name, off, power in (("key", (-1.0, -0.7, 1.3), 18), ("fill", (-0.9, 1.0, 0.5), 6), ("rim", (1.0, 0.2, 1.0), 8)):
            ld = bpy.data.lights.new(name, "AREA")
            ld.energy = power * (size / 0.4) ** 2
            ld.size = size
            lo_ = bpy.data.objects.new(name, ld)
            sc.collection.objects.link(lo_)
            lo_.location = c + Vector(off) * size * 1.6
            look_at(lo_, c)
        shots = {"overview": (Vector((-1.0, -0.45, 0.55)), 50, 2.3, Vector((0, 0, 0))),
                 "detail": (Vector((-0.75, -0.1, 0.85)), 70, 1.5, Vector((0, 0, -0.1)))}
        for tag, (direction, lens, dist, aim) in shots.items():
            cam.data.lens = lens
            cam.location = c + direction.normalized() * size * dist
            look_at(cam, c + aim * size)
            sc.render.filepath = os.path.abspath(f"{a.out}_{idx}_{tag}.png")
            bpy.ops.render.render(write_still=True)
            from PIL import Image
            Image.open(sc.render.filepath).convert("RGB").save(sc.render.filepath[:-4] + ".webp", "WEBP", quality=88)
            os.remove(sc.render.filepath)
            print("[dearv] rendered", sc.render.filepath[:-4] + ".webp", flush=True)


def material_backdrop():
    """A soft paper sweep under the piece."""
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    me = bpy.data.meshes.new("sweep")
    bm.to_mesh(me)
    ob = bpy.data.objects.new("sweep", me)
    bpy.context.scene.collection.objects.link(ob)
    m = bpy.data.materials.new("sweep")
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.62, 0.58, 0.55, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    me.materials.append(m)
    return ob


if __name__ == "__main__":
    main()
