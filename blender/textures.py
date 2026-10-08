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
    rng = np.random.default_rng(7)
    cid = (np.floor(xx * cols) + np.floor(yy * rows) * cols).astype(int)
    lit = rng.random(cols * rows)[cid] < 0.42
    warmth = rng.random(cols * rows)[cid]
    sky = fbm(size, 3, 3, seed=8)
    day = np.where(win[..., None], colorize(sky, (0.26, 0.34, 0.42), (0.55, 0.64, 0.72)),
                   np.array((0.78, 0.77, 0.74))[None, None, :])
    em = np.zeros((size, size, 3))
    warm = colorize(warmth, (1.0, 0.72, 0.42), (0.85, 0.92, 1.0))
    mask = (win & lit)[..., None]
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
