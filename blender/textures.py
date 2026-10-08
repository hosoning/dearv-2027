"""Tileable PBR texture synthesis for the DearV apartment.

Every texture is generated from periodic (FFT-filtered) noise so it tiles
seamlessly. Albedo/roughness/normal sets are written as PNG and consumed by
Blender materials, which the glTF exporter then ships to three.js.
"""
from __future__ import annotations

import os

import numpy as np
from PIL import Image

RNG = np.random.default_rng(2027)


def periodic_noise(size: int, scale: float, aspect=(1.0, 1.0), seed=None) -> np.ndarray:
    """Band-limited noise that wraps perfectly at the image borders."""
    rng = np.random.default_rng(seed) if seed is not None else RNG
    white = rng.standard_normal((size, size))
    fy = np.fft.fftfreq(size)[:, None] * size / aspect[1]
    fx = np.fft.fftfreq(size)[None, :] * size / aspect[0]
    f = np.sqrt(fx * fx + fy * fy)
    spectrum = np.fft.fft2(white) * np.exp(-(f / scale) ** 2)
    out = np.real(np.fft.ifft2(spectrum))
    out -= out.min()
    out /= max(out.max(), 1e-9)
    return out


def fbm(size, base_scale, octaves=5, aspect=(1.0, 1.0), seed=0):
    total = np.zeros((size, size))
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        total += amp * periodic_noise(size, base_scale * 2 ** o, aspect, seed + o)
        norm += amp
        amp *= 0.5
    return total / norm


def normal_from_height(h: np.ndarray, strength: float) -> np.ndarray:
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * strength
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * strength
    n = np.dstack([-dx, dy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return (n * 0.5 + 0.5)


def save(path: str, arr: np.ndarray):
    arr = np.clip(arr, 0, 1)
    if arr.ndim == 2:
        img = Image.fromarray((arr * 255).astype(np.uint8), "L")
    else:
        img = Image.fromarray((arr * 255).astype(np.uint8), "RGB")
    img.save(path, optimize=True)


def colorize(t: np.ndarray, a, b) -> np.ndarray:
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    return a[None, None, :] * (1 - t[..., None]) + b[None, None, :] * t[..., None]


# --------------------------------------------------------------------------
def oak_floor(out, size=1024):
    """Wide-plank European oak, 4 planks across one tile (tile = 0.88 m)."""
    planks_x = 4
    rows = 2
    yy, xx = np.mgrid[0:size, 0:size] / size
    plank_idx = np.floor(xx * planks_x).astype(int)
    # staggered butt joints
    offs = np.array([0.0, 0.37, 0.71, 0.18])[plank_idx % 4]
    v = (yy + offs) % 1.0
    row_idx = np.floor(v * rows).astype(int)
    pid = plank_idx * 7 + row_idx * 3
    grain = fbm(size, 6, 5, aspect=(1.0, 0.08), seed=11)
    fine = fbm(size, 40, 3, aspect=(1.0, 0.15), seed=21)
    ring = 0.5 + 0.5 * np.sin((xx * 90 + grain * 9.0) * np.pi)
    tone_rng = np.random.default_rng(5)
    tones = tone_rng.uniform(-0.09, 0.09, 64)[pid % 64]
    t = np.clip(0.45 + 0.25 * grain + 0.12 * ring * fine + tones, 0, 1)
    albedo = colorize(t, (0.36, 0.24, 0.15), (0.78, 0.62, 0.45))
    # seams
    gx = np.abs((xx * planks_x) - np.round(xx * planks_x)) * size / planks_x
    gy = np.abs((v * rows) - np.round(v * rows)) * size / rows
    seam = np.clip(np.minimum(gx, gy) / 1.6, 0, 1)
    albedo *= (0.55 + 0.45 * seam)[..., None]
    height = 0.6 * seam + 0.04 * ring + 0.05 * fine
    rough = np.clip(0.42 + 0.18 * (1 - seam) * 0 + 0.12 * fine + 0.1 * (1 - seam), 0, 1)
    save(f"{out}/oak_albedo.png", albedo)
    save(f"{out}/oak_rough.png", rough)
    save(f"{out}/oak_normal.png", normal_from_height(height, 3.0))


def marble(out, name="marble", size=1024, base=(0.93, 0.92, 0.9), vein=(0.42, 0.40, 0.40), seed=3):
    n1 = fbm(size, 3, 6, seed=seed)
    n2 = fbm(size, 5, 5, seed=seed + 9)
    yy, xx = np.mgrid[0:size, 0:size] / size
    # periodic diagonal vein field
    v = np.sin((xx + yy) * 2 * np.pi * 2 + n1 * 9.0)
    veins = np.exp(-np.abs(v) * 7.0) * 0.85 + np.exp(-np.abs(np.sin((xx - yy) * 2 * np.pi + n2 * 7)) * 18) * 0.5
    cloud = fbm(size, 8, 4, seed=seed + 4)
    t = np.clip(veins * (0.6 + 0.4 * cloud), 0, 1)
    albedo = colorize(t, base, vein) * (0.96 + 0.06 * cloud[..., None])
    save(f"{out}/{name}_albedo.png", albedo)
    save(f"{out}/{name}_rough.png", 0.12 + 0.08 * cloud)


def fabric(out, name, color, size=512, weave=96, fuzz=0.25, seed=40):
    yy, xx = np.mgrid[0:size, 0:size] / size
    warp = 0.5 + 0.5 * np.sin(xx * 2 * np.pi * weave)
    weft = 0.5 + 0.5 * np.sin(yy * 2 * np.pi * weave)
    check = (np.floor(xx * weave) + np.floor(yy * weave)) % 2
    h = np.where(check > 0, warp, weft)
    slub = fbm(size, 10, 4, aspect=(1, 0.2), seed=seed)
    fz = fbm(size, 60, 2, seed=seed + 3)
    t = 0.75 + 0.15 * h + 0.1 * (slub - 0.5) + fuzz * 0.2 * (fz - 0.5)
    albedo = np.array(color)[None, None, :] * t[..., None]
    save(f"{out}/{name}_albedo.png", albedo)
    save(f"{out}/{name}_normal.png", normal_from_height(h * 0.6 + slub * 0.4, 1.4))


def plaster(out, size=512):
    n = fbm(size, 10, 5, seed=77)
    albedo = colorize(n, (0.86, 0.84, 0.80), (0.93, 0.92, 0.89))
    save(f"{out}/plaster_albedo.png", albedo)
    save(f"{out}/plaster_normal.png", normal_from_height(n, 0.8))


def walnut(out, size=1024):
    yy, xx = np.mgrid[0:size, 0:size] / size
    grain = fbm(size, 5, 6, aspect=(0.06, 1.0), seed=91)
    fine = fbm(size, 50, 2, aspect=(0.1, 1.0), seed=95)
    figure = 0.5 + 0.5 * np.sin((yy * 30 + grain * 6) * np.pi)
    t = np.clip(0.35 + 0.35 * grain + 0.2 * figure * fine, 0, 1)
    albedo = colorize(t, (0.13, 0.075, 0.045), (0.42, 0.27, 0.16))
    save(f"{out}/walnut_albedo.png", albedo)
    save(f"{out}/walnut_normal.png", normal_from_height(figure * 0.2 + fine * 0.3, 1.0))


def terrazzo(out, size=1024):
    base = fbm(size, 12, 3, seed=120)
    albedo = colorize(base, (0.80, 0.78, 0.74), (0.86, 0.84, 0.80))
    rng = np.random.default_rng(121)
    yy, xx = np.mgrid[0:size, 0:size]
    for _ in range(900):
        cx, cy = rng.integers(0, size, 2)
        r = rng.uniform(2, 9)
        col = rng.choice([(0.35, 0.33, 0.31), (0.62, 0.55, 0.47), (0.95, 0.94, 0.92), (0.55, 0.48, 0.42)])
        dx = (xx - cx + size / 2) % size - size / 2
        dy = (yy - cy + size / 2) % size - size / 2
        m = (dx * dx + dy * dy * rng.uniform(0.6, 1.6)) < r * r
        albedo[m] = col
    save(f"{out}/terrazzo_albedo.png", albedo)


def rug(out, size=1024):
    yy, xx = np.mgrid[0:size, 0:size] / size
    pile = fbm(size, 80, 2, seed=140)
    cloud = fbm(size, 4, 4, seed=141)
    border = np.minimum(np.minimum(xx, 1 - xx), np.minimum(yy, 1 - yy))
    band = ((border > 0.035) & (border < 0.055)).astype(float)
    t = 0.85 + 0.1 * pile + 0.05 * cloud
    col = np.array((0.80, 0.76, 0.69))[None, None, :] * t[..., None]
    col = col * (1 - band[..., None]) + np.array((0.45, 0.36, 0.28)) * band[..., None]
    save(f"{out}/rug_albedo.png", col)
    save(f"{out}/rug_normal.png", normal_from_height(pile, 2.0))


def leather(out, size=512):
    cells = fbm(size, 70, 2, seed=160)
    n = fbm(size, 6, 4, seed=161)
    h = np.abs(np.sin(cells * 30))
    albedo = colorize(n, (0.32, 0.18, 0.10), (0.48, 0.28, 0.16)) * (0.85 + 0.15 * h[..., None])
    save(f"{out}/leather_albedo.png", albedo)
    save(f"{out}/leather_normal.png", normal_from_height(h, 1.2))


def facade(out, size=1024, cols=16, rows=32):
    """Tower facade: glass windows (day albedo) + lit-window emission (night)."""
    yy, xx = np.mgrid[0:size, 0:size] / size
    cx = (xx * cols) % 1.0
    cy = (yy * rows) % 1.0
    win = (cx > 0.12) & (cx < 0.88) & (cy > 0.18) & (cy < 0.82)
    win_n = (cx > 0.2) & (cx < 0.8) & (cy > 0.28) & (cy < 0.78)   # lit glass sits inside the frame
    rng = np.random.default_rng(7)
    cid = (np.floor(xx * cols) + np.floor(yy * rows) * cols).astype(int)
    lit = rng.random(cols * rows)[cid] < 0.26
    warmth = rng.random(cols * rows)[cid]
    sky = fbm(size, 3, 3, seed=8)
    day = np.where(win[..., None], colorize(sky, (0.26, 0.34, 0.42), (0.55, 0.64, 0.72)),
                   np.array((0.78, 0.77, 0.74))[None, None, :])
    em = np.zeros((size, size, 3))
    warm = colorize(warmth, (1.0, 0.72, 0.42), (0.85, 0.92, 1.0))
    mask = (win_n & lit)[..., None]
    em = np.where(mask, warm * (0.6 + 0.4 * warmth[..., None]), em)
    save(f"{out}/facade_day.png", day)
    save(f"{out}/facade_night.png", em)


def water_normals(out, size=512):
    h = fbm(size, 10, 5, seed=300) * 0.7 + fbm(size, 30, 3, seed=301) * 0.3
    save(f"{out}/waternormals.png", normal_from_height(h, 6.0))


def generate_all(out: str):
    os.makedirs(out, exist_ok=True)
    oak_floor(out)
    marble(out, "marble")
    marble(out, "darkmarble", base=(0.10, 0.10, 0.11), vein=(0.75, 0.72, 0.68), seed=17)
    fabric(out, "linen", (0.86, 0.83, 0.77), seed=40)
    fabric(out, "boucle", (0.90, 0.88, 0.84), weave=140, fuzz=1.0, seed=50)
    fabric(out, "velvet", (0.20, 0.27, 0.25), weave=200, fuzz=0.6, seed=60)
    fabric(out, "duvet", (0.95, 0.94, 0.92), weave=160, seed=70)
    plaster(out)
    walnut(out)
    terrazzo(out)
    rug(out)
    leather(out)
    facade(out)
    water_normals(out)
    photos(out)
    pajamas(out)
    gifts_2025(out)
    world_map(out)
    couture(out)
    plush(out)
    road(out)


if __name__ == "__main__":
    import sys
    generate_all(sys.argv[1] if len(sys.argv) > 1 else "build/textures")


def photos(out, count=8, size=512):
    """Soft painterly placeholder photographs for the memory wall."""
    palettes = [
        ((0.98, 0.78, 0.62), (0.45, 0.55, 0.78)), ((0.95, 0.86, 0.70), (0.85, 0.45, 0.42)),
        ((0.62, 0.78, 0.86), (0.98, 0.93, 0.85)), ((0.30, 0.36, 0.52), (0.98, 0.70, 0.45)),
        ((0.82, 0.88, 0.76), (0.42, 0.52, 0.40)), ((0.96, 0.80, 0.84), (0.55, 0.45, 0.65)),
        ((0.20, 0.25, 0.38), (0.95, 0.85, 0.55)), ((0.92, 0.90, 0.86), (0.70, 0.58, 0.48)),
    ]
    yy, xx = np.mgrid[0:size, 0:size] / size
    for i in range(count):
        a, b = palettes[i % len(palettes)]
        n = fbm(size, 4, 5, seed=500 + i)
        t = np.clip(yy * 0.8 + (n - 0.5) * 0.7, 0, 1)
        img = colorize(t, a, b)
        # a soft sun / bokeh disc so each frame reads as a photograph
        cx, cy = 0.3 + 0.4 * ((i * 37) % 10) / 10, 0.25 + 0.3 * ((i * 53) % 10) / 10
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        img += np.exp(-(d / 0.09) ** 2)[..., None] * 0.35
        vign = 1 - 0.35 * ((xx - 0.5) ** 2 + (yy - 0.5) ** 2) * 2
        save(f"{out}/photo_{i}.png", img * vign[..., None])


# --------------------------------------------------------------------------
# Quin's pajamas: charcoal satin with silver dotted pinstripes, "Quin's." cuff
# embroidery, and the white PRIFU gift box with its arched lighthouse window.
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")


def _font(name, size):
    from PIL import ImageFont
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def _pinstripe(size, stripes=6, seed=600):
    yy, xx = np.mgrid[0:size, 0:size] / size
    sheen = fbm(size, 3, 4, aspect=(1.0, 0.3), seed=seed)
    base = colorize(sheen, (0.10, 0.105, 0.12), (0.22, 0.225, 0.25))
    phase = (xx * stripes) % 1.0
    line = np.exp(-((phase - 0.5) * size / stripes / 1.2) ** 2)
    dots = (np.sin(yy * size * 0.9) > -0.2).astype(float)
    silver = (line * dots)[..., None] * np.array((0.78, 0.8, 0.84))
    return np.clip(base * (1 - line[..., None] * 0.9) + silver, 0, 1), line


def pajamas(out, size=512):
    from PIL import Image as PImage, ImageDraw
    alb, line = _pinstripe(size)
    save(f"{out}/pinstripe_albedo.png", alb)
    weave = fbm(size, 90, 2, aspect=(1, 0.3), seed=610)
    save(f"{out}/pinstripe_normal.png", normal_from_height(weave * 0.5 + line * 0.3, 1.0))

    # Cuff band (folded trouser hem) with the embroidered name
    W, Hh = 1024, 256
    band, _ = _pinstripe(1024)
    band = band[:Hh] * 0.95
    img = PImage.fromarray((band * 255).astype(np.uint8), "RGB")
    txt = PImage.new("L", (W, Hh), 0)
    d = ImageDraw.Draw(txt)
    f = _font("dancing-script-latin-400-normal.woff", 132)
    d.text((W / 2, Hh / 2 + 6), "Quin's.", font=f, fill=255, anchor="mm")
    txt = txt.rotate(9, resample=PImage.BICUBIC, center=(W / 2, Hh / 2))
    thread = PImage.new("RGB", (W, Hh), (226, 224, 216))
    img.paste(thread, (0, 0), txt)
    d2 = ImageDraw.Draw(img)
    for y in (10, Hh - 12):  # hem stitching
        for x in range(0, W, 14):
            d2.line([(x, y), (x + 8, y)], fill=(70, 72, 78), width=2)
    img.save(f"{out}/cuff_quins_albedo.png")

    # Box lid art
    W, Hh = 768, 1024
    paper = colorize(fbm(Hh, 40, 3, seed=620)[:, :W] if False else fbm(1024, 40, 3, seed=620)[:, :W],
                     (0.95, 0.945, 0.935), (0.985, 0.98, 0.975))
    img = PImage.fromarray((paper * 255).astype(np.uint8), "RGB")
    d = ImageDraw.Draw(img)
    ax0, ax1, ay0, ay1 = 250, 518, 260, 640
    r = (ax1 - ax0) // 2
    # night-sea scene inside an arch
    scene = PImage.new("RGB", (W, Hh))
    sd = ImageDraw.Draw(scene)
    for y in range(ay0 - r, ay1):
        t = (y - (ay0 - r)) / (ay1 - ay0 + r)
        c = tuple(int(255 * v) for v in (0.17 + 0.12 * t, 0.21 + 0.12 * t, 0.26 + 0.1 * t))
        sd.line([(ax0, y), (ax1, y)], fill=c)
    horizon = 520
    sd.rectangle([ax0, horizon, ax1, ay1], fill=(38, 46, 56))
    for k in range(18):
        yk = horizon + 8 + k * 6
        sd.line([(ax0 + 20 + (k * 37) % 60, yk), (ax1 - 30 - (k * 23) % 50, yk)], fill=(70, 82, 96), width=1)
    sd.rectangle([ax0, horizon - 22, ax1, horizon], fill=(30, 36, 44))           # breakwater
    lx = 404
    sd.polygon([(lx - 12, horizon - 22), (lx + 12, horizon - 22), (lx + 7, horizon - 120), (lx - 7, horizon - 120)],
               fill=(28, 32, 38))                                                  # lighthouse tower
    sd.rectangle([lx - 10, horizon - 140, lx + 10, horizon - 120], fill=(240, 226, 170))
    sd.polygon([(lx - 13, horizon - 140), (lx + 13, horizon - 140), (lx, horizon - 158)], fill=(28, 32, 38))
    sd.ellipse([300, 370, 330, 400], fill=(236, 236, 228))                       # moon
    for bx, by in ((330, 450), (352, 440)):
        sd.arc([bx - 8, by - 4, bx, by + 4], 200, 340, fill=(220, 220, 214), width=2)
        sd.arc([bx, by - 4, bx + 8, by + 4], 200, 340, fill=(220, 220, 214), width=2)
    mask = PImage.new("L", (W, Hh), 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([ax0, ay0, ax1, ay1], fill=255)
    md.ellipse([ax0, ay0 - r, ax1, ay0 + r], fill=255)
    img.paste(scene, (0, 0), mask)
    rng = np.random.default_rng(630)
    for _ in range(26):  # stars and little moons around the arch
        a = rng.uniform(0, 2 * np.pi)
        rad = rng.uniform(r + 25, r + 110)
        sx, sy = W / 2 + rad * np.cos(a) * 0.9, (ay0 + 80) + rad * np.sin(a) * 1.25
        s = rng.uniform(2, 6)
        d.polygon([(sx, sy - s), (sx + s * 0.3, sy), (sx, sy + s), (sx - s * 0.3, sy)], fill=(40, 42, 48))
        d.polygon([(sx - s, sy), (sx, sy + s * 0.3), (sx + s, sy), (sx, sy - s * 0.3)], fill=(40, 42, 48))
    d.text((W / 2, ay1 + 40), "Sweet Dreams", font=_font("cormorant-garamond-latin-500-italic.woff", 40),
           fill=(60, 60, 64), anchor="mm")
    d.text((W / 2, ay1 + 150), "P R I F U", font=_font("cormorant-garamond-latin-500-italic.woff", 54),
           fill=(40, 40, 44), anchor="mm")
    d.text((W / 2, ay1 + 225), "派赋", font=_font("noto-serif-sc-prifu.ttf", 48), fill=(40, 40, 44), anchor="mm")
    img.save(f"{out}/prifu_box_albedo.png")


def gifts_2025(out):
    """Tie-clip box & disc (Enrico Coveri), the 520 gold coin, the Best Wishes card."""
    from PIL import Image as PImage, ImageDraw
    serif = "cormorant-garamond-latin-500-italic.woff"
    # Enrico Coveri box lid: warm grey sparkle paper with the EC monogram
    W = 1024
    n = fbm(W, 120, 2, seed=700)
    paper = colorize(n, (0.56, 0.55, 0.53), (0.66, 0.65, 0.63))
    rng = np.random.default_rng(701)
    paper[rng.random((W, W)) > 0.996] = (0.9, 0.9, 0.88)
    img = PImage.fromarray((paper * 255).astype(np.uint8), "RGB")
    d = ImageDraw.Draw(img)
    ink = (122, 108, 102)
    d.text((W / 2, W * 0.42), "EC", font=_font(serif, 260), fill=ink, anchor="mm")
    d.ellipse([W / 2 - 150, W * 0.42 - 150, W / 2 + 150, W * 0.42 + 150], outline=ink, width=6)
    d.text((W / 2, W * 0.68), "ENRICO COVERI", font=_font(serif, 96), fill=ink, anchor="mm")
    img.save(f"{out}/ec_box_albedo.png")
    # tie-clip disc: engraved name ring around a garnet stone
    S = 512
    img = PImage.new("RGB", (S, S), (205, 207, 212))
    d = ImageDraw.Draw(img)
    d.ellipse([8, 8, S - 8, S - 8], fill=(214, 216, 220), outline=(150, 152, 158), width=6)
    d.ellipse([150, 150, S - 150, S - 150], fill=(92, 18, 52))
    d.ellipse([195, 175, 250, 215], fill=(190, 90, 140))
    f = _font(serif, 44)
    text = "ENRICO COVERI · ENRICO COVERI · "
    for k, ch in enumerate(text):
        a = 2 * np.pi * k / len(text) - np.pi / 2
        tile = PImage.new("L", (60, 60), 0)
        ImageDraw.Draw(tile).text((30, 30), ch, font=f, fill=255, anchor="mm")
        tile = tile.rotate(-np.degrees(a) - 90, resample=PImage.BICUBIC)
        cx, cy = S / 2 + 175 * np.cos(a), S / 2 + 175 * np.sin(a)
        img.paste((95, 97, 104), (int(cx - 30), int(cy - 30)), tile)
    img.save(f"{out}/tieclip_disc_albedo.png")
    # 520 gold coin: albedo + embossed normal
    S = 1024
    h = PImage.new("L", (S, S), 0)
    d = ImageDraw.Draw(h)
    d.ellipse([20, 20, S - 20, S - 20], fill=90)
    for k in range(72):  # scalloped inner rim
        a = 2 * np.pi * k / 72
        cx, cy = S / 2 + 400 * np.cos(a), S / 2 + 400 * np.sin(a)
        d.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], fill=150)
    d.ellipse([110, 110, S - 110, S - 110], fill=70)
    d.text((S / 2, S / 2 + 10), "520", font=_font("DejaVuSerif-Bold.ttf", 300), fill=235, anchor="mm")
    for k in range(10):  # little hearts and stars around the numerals
        a = 2 * np.pi * k / 10 + 0.3
        cx, cy = S / 2 + 310 * np.cos(a), S / 2 + 310 * np.sin(a)
        if k % 2 == 0:
            r = 18
            d.ellipse([cx - r, cy - r, cx, cy], fill=200); d.ellipse([cx, cy - r, cx + r, cy], fill=200)
            d.polygon([(cx - r, cy - r / 2), (cx + r, cy - r / 2), (cx, cy + r)], fill=200)
        else:
            d.polygon([(cx, cy - 16), (cx + 5, cy), (cx, cy + 16), (cx - 5, cy)], fill=190)
            d.polygon([(cx - 16, cy), (cx, cy + 5), (cx + 16, cy), (cx, cy - 5)], fill=190)
    hh = np.asarray(h, dtype=float) / 255
    hh = _blur(hh, 1.5) if "_blur" in globals() else hh
    gold = colorize(np.clip(hh * 1.2, 0, 1), (0.72, 0.52, 0.16), (1.0, 0.84, 0.42))
    save(f"{out}/coin520_albedo.png", gold)
    save(f"{out}/coin520_normal.png", normal_from_height(hh, 6.0))
    # Best Wishes card
    W, Hh = 768, 640
    img = PImage.new("RGB", (W, Hh), (246, 241, 234))
    d = ImageDraw.Draw(img)
    for k in range(14):  # soft painted roses around the border
        cx, cy = rng.uniform(0, W), (rng.uniform(0, 110) if k % 2 else rng.uniform(Hh - 110, Hh))
        r = rng.uniform(30, 60)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(236, 200, 196) if k % 3 else (214, 222, 205))
        d.ellipse([cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5], fill=(225, 178, 176))
    d.text((W / 2, Hh / 2 - 30), "Best Wishes", font=_font(serif, 92), fill=(70, 66, 64), anchor="mm")
    d.text((W / 2, Hh / 2 + 50), "Loving companion at all times", font=_font(serif, 40), fill=(90, 86, 84), anchor="mm")
    img.save(f"{out}/bestwishes_card_albedo.png")


def _blur(a, sigma):
    r = int(sigma * 3)
    k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * sigma * sigma))
    k /= k.sum()
    for axis in (0, 1):
        a = sum(w * np.roll(a, i - r, axis=axis) for i, w in enumerate(k))
    return a


# --------------------------------------------------------------------------
# Big-flat additions: world map, couture wordmark boxes, suit wool, tweed, plush.
def _topo_rings(path):
    import json
    t = json.load(open(path))
    sc, tr = t["transform"]["scale"], t["transform"]["translate"]
    arcs = []
    for arc in t["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    rings = []
    for g in t["objects"]["land"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        for poly in polys:
            for ring in poly:
                pts = []
                for a in ring:
                    seg = arcs[a] if a >= 0 else arcs[~a][::-1]
                    pts.extend(seg[1:] if pts else seg)
                rings.append(pts)
    return rings


def world_map(out, W=2048, H=1024):
    from PIL import Image as PImage, ImageDraw, ImageFilter
    paper = colorize(fbm(2048, 6, 4, seed=800)[:H, :W], (0.86, 0.8, 0.68), (0.95, 0.91, 0.82))
    img = PImage.fromarray((paper * 255).astype(np.uint8), "RGB")
    d = ImageDraw.Draw(img)
    for lon in range(-180, 181, 30):  # graticule
        x = (lon + 180) / 360 * W
        d.line([(x, 0), (x, H)], fill=(196, 182, 156), width=1)
    for lat in range(-60, 91, 30):
        y = (90 - lat) / 180 * H
        d.line([(0, y), (W, y)], fill=(196, 182, 156), width=1)
    land = PImage.new("L", (W, H), 0)
    ld = ImageDraw.Draw(land)
    for ring in _topo_rings(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "land-110m.json")):
        # unwrap longitudes across the antimeridian, then draw shifted copies so nothing streaks
        un, off = [], 0.0
        for k, (lon, lat) in enumerate(ring):
            if k and lon + off - un[-1][0] > 180:
                off -= 360
            elif k and lon + off - un[-1][0] < -180:
                off += 360
            un.append((lon + off, lat))
        if len(un) < 3:
            continue
        if abs(un[-1][0] - un[0][0]) > 180:   # ring wraps the globe (Antarctica): close along the pole
            un += [(un[-1][0], -90), (un[0][0], -90)]
        for shift in (-360, 0, 360):
            ld.polygon([((lon + shift + 180) / 360 * W, (90 - lat) / 180 * H) for lon, lat in un], fill=255)
    edge = land.filter(ImageFilter.FIND_EDGES)
    img.paste((120, 140, 118), (0, 0), land)
    img.paste((70, 82, 70), (0, 0), edge)
    f = _font("cormorant-garamond-latin-500-italic.woff", 64)
    d.text((W * 0.14, H * 0.58), "Our Travels", font=f, fill=(90, 70, 50), anchor="mm")
    img.save(f"{out}/world_map_albedo.png")


def couture(out):
    """Wordmark boxes and garment bags for the walk-in closet (text only, no logos)."""
    from PIL import Image as PImage, ImageDraw
    serif = "cormorant-garamond-latin-500-italic.woff"
    brands = {
        "hermes": ((232, 118, 38), (92, 52, 22), "HERMÈS", "PARIS", "cinzel-latin-500-normal.woff"),
        "chanel": ((16, 16, 16), (236, 236, 232), "CHANEL", "", "montserrat-latin-600-normal.woff"),
        "dior": ((206, 202, 196), (40, 40, 40), "DIOR", "", "cinzel-latin-500-normal.woff"),
        "loropiana": ((214, 200, 178), (90, 70, 50), "LORO PIANA", "", "cinzel-latin-500-normal.woff"),
        "tomford": ((20, 20, 22), (214, 196, 160), "TOM FORD", "", "montserrat-latin-600-normal.woff"),
        "cartier": ((150, 20, 32), (224, 186, 110), "Cartier", "", serif),
    }
    for key, (bg, ink, word, sub, face) in brands.items():
        img = PImage.new("RGB", (512, 512), bg)
        d = ImageDraw.Draw(img)
        d.rectangle([14, 14, 498, 498], outline=ink, width=3)
        d.text((256, 240), word, font=_font(face, 62 if len(word) < 8 else 44), fill=ink, anchor="mm")
        if sub:
            d.text((256, 300), sub, font=_font(serif, 30), fill=ink, anchor="mm")
        img.save(f"{out}/brand_{key}_albedo.png")
    # suit wool (fine twill) and Chanel-style tweed
    S = 512
    tw = fbm(S, 120, 2, aspect=(1, 0.3), seed=820)
    diag = 0.5 + 0.5 * np.sin((np.mgrid[0:S, 0:S][0] + np.mgrid[0:S, 0:S][1]) * 2 * np.pi / 6)
    save(f"{out}/wool_albedo.png", np.dstack([0.75 + 0.15 * tw + 0.1 * diag] * 3))
    save(f"{out}/wool_normal.png", normal_from_height(diag * 0.5 + tw * 0.5, 0.8))
    rng = np.random.default_rng(830)
    tweed = colorize(fbm(S, 60, 3, seed=831), (0.85, 0.82, 0.78), (0.97, 0.95, 0.92))
    for _ in range(9000):
        x, y = rng.integers(0, S, 2)
        c = rng.choice([(0.2, 0.2, 0.22), (0.86, 0.72, 0.62), (0.95, 0.95, 0.95)])
        tweed[y:y + 2, x:x + rng.integers(2, 7)] = c
    save(f"{out}/tweed_albedo.png", tweed)


def plush(out, size=512):
    """Short-pile plush upholstery for the living-room sofa."""
    pile = fbm(size, 160, 2, seed=840)
    cloud = fbm(size, 6, 3, seed=841)
    t = 0.86 + 0.08 * pile + 0.06 * cloud
    save(f"{out}/plush_albedo.png", np.dstack([t] * 3))
    save(f"{out}/plush_normal.png", normal_from_height(pile, 1.6))


def road(out, W=256, H=512):
    """One 12 m x 24 m tile of the six-lane waterfront highway (u along the road, v across)."""
    v = np.linspace(0, 24, H)[:, None] * np.ones((1, W))
    u = np.linspace(0, 12, W)[None, :] * np.ones((H, 1))
    asphalt = colorize(fbm(512, 60, 3, seed=900)[:H, :W], (0.13, 0.13, 0.14), (0.2, 0.2, 0.21))
    def line(c, w=0.15):
        return np.abs(v - c) < w / 2
    white = np.zeros((H, W), bool)
    for c in (0.4, 23.6):
        white |= line(c)
    dash = (u % 12) < 6
    for c in (3.75, 7.25, 16.75, 20.25):
        white |= line(c) & dash
    yellow = line(10.6) | line(13.4)
    median = (v > 10.75) & (v < 13.25)
    img = asphalt.copy()
    img[median] = (0.32, 0.33, 0.3)
    img[white] = (0.85, 0.85, 0.82)
    img[yellow] = (0.85, 0.7, 0.2)
    save(f"{out}/road_albedo.png", np.flipud(img))
