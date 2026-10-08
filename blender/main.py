"""Build the DearV apartment in Blender, bake lightmaps, export for three.js.

Usage (Blender as a Python module, `pip install bpy==5.2.2`):
    python blender/main.py --out web/public/assets [--quick] [--no-bake]
or inside Blender:
    blender -b -P blender/main.py -- --out web/public/assets
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

import apartment  # noqa: E402
import bake  # noqa: E402
import exterior  # noqa: E402
import lib  # noqa: E402
import textures  # noqa: E402


def to_three(v):
    """Blender (x, y, z) -> three.js (x, z, -y)."""
    x, y, z = v
    return [round(x, 4), round(z, 4), round(-y, 4)]


def strip_hidden_shell_faces(objs, pad=0.01):
    """Delete shell faces that only ever face outside (wall exteriors, slab undersides).

    They are never visible from the apartment, yet would take lightmap atlas space.
    """
    import bmesh
    from mathutils import Vector
    lo, hi = Vector((apartment.XW, -5, 0)), Vector((7, 5, 3.0))
    for ob in objs:
        if not (ob.name.startswith(("floor_", "wall_", "ceiling"))):
            continue
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        mw = ob.matrix_world
        kill = []
        for f in bm.faces:
            c = mw @ f.calc_center_median()
            n = (mw.to_3x3() @ f.normal).normalized()
            outside = any((c[i] < lo[i] - pad and n[i] < -0.5) or (c[i] > hi[i] + pad and n[i] > 0.5)
                          for i in range(3))
            if outside or (ob.name.startswith("floor_") and n.z < -0.5) or \
                    (ob.name == "ceiling" and n.z > 0.5):
                kill.append(f)
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bm.to_mesh(ob.data)
        bm.free()


def apply_uvs():
    """UV pass shared by the build and the product renders: hide outward shell faces,
    box-project tiling textures, and fit decal textures (rugs, photos, labels) to their objects."""
    ext = lib.collection("Exterior")
    interior = list(lib.collection("Interior").objects)
    strip_hidden_shell_faces(lib.LIGHTMAP_GROUPS["arch"])
    for ob in interior:
        if ob.type != "MESH":
            continue
        if ob.get("uvfit"):
            # rugs / photos / TV: stretch the texture over the object's own extent
            import bmesh
            mode = ob["uvfit"] if isinstance(ob["uvfit"], str) else "xy"
            flip = mode.startswith("-")
            ia, ib = {"xy": (0, 1), "yx": (1, 0), "yz": (1, 2), "xz": (0, 2)}[mode.lstrip("-")]
            bm = bmesh.new(); bm.from_mesh(ob.data)
            uv = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
            ca = [v.co[ia] for v in bm.verts]; cb = [v.co[ib] for v in bm.verts]
            for f in bm.faces:
                for l in f.loops:
                    u = (l.vert.co[ia] - min(ca)) / (max(ca) - min(ca))
                    l[uv].uv = (1 - u if flip else u, (l.vert.co[ib] - min(cb)) / (max(cb) - min(cb)))
            bm.to_mesh(ob.data); bm.free()
        else:
            lib.box_project_uv(ob)
    for ob in ext.objects:
        if ob.type == "MESH" and not ob.get("facade"):
            lib.box_project_uv(ob, tile=(50, 50))
    return interior, ext


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "..", "web", "public", "assets"))
    ap.add_argument("--tex", default=os.path.join(HERE, "..", "build", "textures"))
    ap.add_argument("--quick", action="store_true", help="low samples / resolution preview bake")
    ap.add_argument("--no-bake", action="store_true")
    ap.add_argument("--blend", default="", help="optionally save the .blend here")
    args = ap.parse_args(argv)
    out = os.path.abspath(args.out)
    os.makedirs(os.path.join(out, "lightmaps"), exist_ok=True)
    os.makedirs(os.path.join(out, "textures"), exist_ok=True)
    t0 = time.time()

    tex = os.path.abspath(args.tex)
    if not os.path.exists(os.path.join(tex, "prifu_box_albedo.png")):
        print("[dearv] generating textures ->", tex)
        textures.generate_all(tex)
    lib.TEX_DIR = tex

    lib.reset_scene()
    apartment.build()
    ext = exterior.build()
    bpy.context.view_layer.update()

    interior, ext = apply_uvs()
    print(f"[dearv] geometry built in {time.time() - t0:.1f}s; "
          f"arch={len(lib.LIGHTMAP_GROUPS['arch'])} furn={len(lib.LIGHTMAP_GROUPS['furn'])}")

    manifest = {"lightmaps": {}, "version": int(time.time())}
    hide_always = [o for o in interior if o.type == "MESH" and (o.get("glass") or o.get("curtain"))]
    for o in ext.objects:
        o.hide_render = True

    if not args.no_bake:
        res = {"arch": 1024 if args.quick else 2048, "furn": 1024 if args.quick else 2048}
        samples = {"day": 48 if args.quick else 192, "night": 64 if args.quick else 256}
        for group, objs in lib.LIGHTMAP_GROUPS.items():
            t = time.time()
            bake.lightmap_uvs(objs, res=res[group], margin_px=4)
            print(f"[dearv] lightmap UVs {group}: {time.time() - t:.1f}s")
        for mode in ("day", "night"):
            bake.configure_cycles(samples[mode])
            bake.set_mode(mode, apartment.LIGHTS_NIGHT, hide_always)
            for group, objs in lib.LIGHTMAP_GROUPS.items():
                t = time.time()
                px = bake.bake_group(objs, f"lm_{group}", res[group])
                px = bake.denoise(px)
                fn = f"{group}_{mode}.webp"
                scale = bake.encode(px, os.path.join(out, "lightmaps", fn))
                manifest["lightmaps"].setdefault(group, {})[mode] = {"file": f"lightmaps/{fn}", "scale": scale}
                print(f"[dearv] baked {group}/{mode} {res[group]}px in {time.time() - t:.1f}s (scale {scale:.3f})")
        bake.remove_bake_nodes()
        # restore day state for export (emission factors off; three drives them)
        bake.set_mode("day", apartment.LIGHTS_NIGHT, hide_always)

    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.blend))

    # Export ------------------------------------------------------------------------
    def export(coll, path):
        for o in coll.objects:
            o.hide_render = False
        bpy.context.view_layer.update()
        bpy.context.view_layer.active_layer_collection = \
            bpy.context.view_layer.layer_collection.children[coll.name]
        bpy.ops.export_scene.gltf(
            filepath=path, export_format="GLB", use_active_collection=True,
            use_active_collection_with_nested=True, export_extras=True, export_yup=True,
            export_apply=False, export_image_format="WEBP", export_image_quality=88, export_lights=False,
            export_cameras=False, export_texcoords=True, export_normals=True, export_tangents=False,
            export_materials="EXPORT", export_animations=False)

    export(lib.collection("Interior"), os.path.join(out, "apartment.glb"))
    export(ext, os.path.join(out, "city.glb"))
    for name in ("facade_night", "waternormals"):
        src = os.path.join(tex, name + ".png")
        from PIL import Image
        Image.open(src).save(os.path.join(out, "textures", name + ".webp"), "WEBP", quality=90)

    # Scene manifest -------------------------------------------------------------
    cols = []
    for c in lib.COLLIDERS:
        (x0, y0), (x1, y1) = c["min"], c["max"]
        cols.append({"min": [round(x0, 3), round(-y1, 3)], "max": [round(x1, 3), round(-y0, 3)]})
    emitters = {}
    for name, strength in lib.NIGHT_EMITTERS.items():
        m = bpy.data.materials[name]
        emitters[name] = {"color": list(m.get("emit_color", (1, 1, 1))), "strength": strength}
    manifest.update({
        "colliders": cols,
        "interactables": apartment.INTERACT,
        "emitters": emitters,
        "spawn": {"position": to_three((5.8, -4.1, 1.62)), "lookAt": to_three((3.0, 3.0, 1.4))},
        "bounds": {"min": [apartment.XW, -5], "max": [7, 5]},
        "waterY": exterior.WATER_Z,
        "sunDirection": to_three((-0.28, 0.77, 0.57)),
    })
    with open(os.path.join(out, "scene.json"), "w") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(f"[dearv] done in {time.time() - t0:.1f}s -> {out}")


if __name__ == "__main__":
    main()
