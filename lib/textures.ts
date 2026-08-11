import * as THREE from 'three';

// Procedural canvas textures for the memory house — ported from the original
// prototype and rebuilt as typed utilities. All of these draw onto an
// off-screen <canvas> so they only work client-side.

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

/** Herringbone wood parquet floor. */
export function createFloorTexture(size = 512): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const plankLength = size / 8;
  const plankWidth = plankLength / 4;
  const baseHue = 28;

  ctx.fillStyle = `hsl(${baseHue}, 35%, 42%)`;
  ctx.fillRect(0, 0, size, size);

  const drawPlank = (x: number, y: number, angle: number) => {
    const shade = 30 + Math.random() * 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, -plankWidth / 2, 0, plankWidth / 2);
    grad.addColorStop(0, `hsl(${baseHue + Math.random() * 6}, 40%, ${shade + 6}%)`);
    grad.addColorStop(1, `hsl(${baseHue + Math.random() * 6}, 40%, ${shade - 6}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(-plankLength / 2, -plankWidth / 2, plankLength, plankWidth);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-plankLength / 2, -plankWidth / 2, plankLength, plankWidth);
    // wood grain streaks
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 3; i++) {
      const gy = -plankWidth / 2 + (i + 0.5) * (plankWidth / 3);
      ctx.beginPath();
      ctx.moveTo(-plankLength / 2, gy);
      ctx.lineTo(plankLength / 2, gy);
      ctx.stroke();
    }
    ctx.restore();
  };

  const step = plankLength / Math.SQRT2;
  for (let row = -1; row * step < size + plankLength; row++) {
    for (let col = -1; col * step < size + plankLength; col++) {
      const offset = row % 2 === 0 ? 0 : step / 2;
      const cx = col * step + offset;
      const cy = row * (plankWidth * Math.SQRT2);
      drawPlank(cx, cy, Math.PI / 4);
      drawPlank(cx + plankWidth * Math.SQRT2, cy + plankWidth * Math.SQRT2, -Math.PI / 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Soft plaster wall with subtle stipple noise. */
export function createWallTexture(size = 512, hue = 36, lightness = 92): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = `hsl(${hue}, 18%, ${lightness}%)`;
  ctx.fillRect(0, 0, size, size);

  const dots = size * 22;
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.1;
    const shade = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Polished marble with veining, used for kitchen island / countertops. */
export function createMarbleTexture(size = 512, baseHue = 210): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = `hsl(${baseHue}, 12%, 94%)`;
  ctx.fillRect(0, 0, size, size);

  const drawVein = (startX: number, startY: number) => {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    let x = startX;
    let y = startY;
    ctx.strokeStyle = `hsla(${baseHue + (Math.random() * 20 - 10)}, 15%, ${55 + Math.random() * 15}%, ${0.3 + Math.random() * 0.3})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    for (let i = 0; i < 12; i++) {
      x += (Math.random() - 0.5) * size * 0.18;
      y += (Math.random() - 0.3) * size * 0.12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  for (let i = 0; i < 10; i++) {
    drawVein(Math.random() * size, Math.random() * size * 0.3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Victoria Harbour night skyline, used for the window view. */
export function createHKNightTexture(width = 1024, height = 640): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#050818');
  sky.addColorStop(0.55, '#0c1230');
  sky.addColorStop(1, '#1a1f3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // stars
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.45;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  const horizon = height * 0.72;

  // harbour water reflection
  const water = ctx.createLinearGradient(0, horizon, 0, height);
  water.addColorStop(0, '#0a1330');
  water.addColorStop(1, '#020408');
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon, width, height - horizon);

  // skyline silhouette — layered buildings
  const buildingLayers = [
    { color: '#141c3a', baseY: horizon, count: 26, alpha: 0.9 },
    { color: '#0c1226', baseY: horizon, count: 18, alpha: 1 },
  ];

  buildingLayers.forEach((layer, layerIdx) => {
    let x = -20;
    ctx.fillStyle = layer.color;
    ctx.globalAlpha = layer.alpha;
    while (x < width + 20) {
      const w = 18 + Math.random() * 48;
      const h = 40 + Math.random() * (horizon * (layerIdx === 0 ? 0.75 : 0.55));
      const y = layer.baseY - h;
      ctx.fillRect(x, y, w, h);

      // lit windows
      const winRows = Math.floor(h / 10);
      const winCols = Math.floor(w / 8);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (Math.random() > 0.55) {
            ctx.fillStyle = Math.random() > 0.85 ? 'rgba(255,210,120,0.9)' : 'rgba(180,210,255,0.55)';
            ctx.fillRect(x + 2 + c * 8, y + 4 + r * 10, 3, 4);
            ctx.fillStyle = layer.color;
          }
        }
      }
      x += w + 3 + Math.random() * 6;
    }
    ctx.globalAlpha = 1;
  });

  // water reflections of the lights (soft vertical streaks)
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const len = 10 + Math.random() * 40;
    const grad = ctx.createLinearGradient(x, horizon, x, horizon + len);
    grad.addColorStop(0, 'rgba(180,210,255,0.25)');
    grad.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, horizon, 1.5, len);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
