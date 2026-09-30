import * as THREE from 'three';

function seeded(seedStart = 73) {
  let seed = seedStart;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function createCityPanoramaTexture({
  season,
  isNight,
  weather,
  width = 1280,
  height = 720,
}: {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  isNight: boolean;
  weather: 'clear' | 'rain' | 'snow';
  width?: number;
  height?: number;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  const random = seeded(3187 + season.length * 13 + (isNight ? 97 : 0));

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  if (isNight) {
    sky.addColorStop(0, '#07101e');
    sky.addColorStop(0.5, '#14243b');
    sky.addColorStop(0.78, '#4b4050');
    sky.addColorStop(1, '#8a674d');
  } else if (weather === 'rain') {
    sky.addColorStop(0, '#8799a3');
    sky.addColorStop(0.58, '#b6c1c3');
    sky.addColorStop(1, '#ddd6cb');
  } else if (season === 'autumn') {
    sky.addColorStop(0, '#78aeca');
    sky.addColorStop(0.62, '#d9b59d');
    sky.addColorStop(1, '#f0d4b7');
  } else if (season === 'winter') {
    sky.addColorStop(0, '#9db1bc');
    sky.addColorStop(0.62, '#c4cfd1');
    sky.addColorStop(1, '#e1ded8');
  } else {
    sky.addColorStop(0, '#6faecc');
    sky.addColorStop(0.62, '#b8d2d8');
    sky.addColorStop(1, '#edcfb6');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (isNight) {
    for (let i = 0; i < 120; i++) {
      const x = random() * width;
      const y = random() * height * 0.42;
      const r = 0.4 + random() * 1.2;
      ctx.fillStyle = `rgba(255,245,220,${0.2 + random() * 0.55})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const hazeY = height * 0.61;
  const haze = ctx.createLinearGradient(0, hazeY - 80, 0, hazeY + 80);
  haze.addColorStop(0, 'rgba(235,225,211,0)');
  haze.addColorStop(0.55, isNight ? 'rgba(104,91,95,.2)' : 'rgba(239,228,213,.28)');
  haze.addColorStop(1, 'rgba(235,225,211,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, hazeY - 80, width, 160);

  const mountainBase = height * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, mountainBase);
  for (let x = 0; x <= width; x += 32) {
    const ridge = Math.sin(x * 0.008) * 30 + Math.sin(x * 0.021) * 18 + (random() - 0.5) * 14;
    ctx.lineTo(x, mountainBase - 70 - ridge);
  }
  ctx.lineTo(width, mountainBase + 40);
  ctx.lineTo(0, mountainBase + 40);
  ctx.closePath();
  ctx.fillStyle = isNight ? 'rgba(31,38,49,.62)' : 'rgba(91,103,100,.28)';
  ctx.fill();

  const horizon = height * 0.76;
  const layers = [
    { base: horizon, color: isNight ? '#27303a' : '#8f8c84', alpha: 0.68, min: 24, max: 72, maxHeight: 175 },
    { base: horizon + 5, color: isNight ? '#171e28' : '#75736d', alpha: 0.9, min: 32, max: 96, maxHeight: 235 },
  ];

  layers.forEach((layer, layerIndex) => {
    let x = -30;
    while (x < width + 40) {
      const w = layer.min + random() * (layer.max - layer.min);
      const h = 45 + random() * layer.maxHeight;
      const y = layer.base - h;
      ctx.globalAlpha = layer.alpha;
      ctx.fillStyle = layer.color;
      ctx.fillRect(x, y, w, h);

      if (random() > 0.62) {
        ctx.fillRect(x + w * 0.42, y - 16 - random() * 20, w * 0.12, 18 + random() * 22);
      }
      if (random() > 0.76) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y - 34);
        ctx.lineTo(x + w * 0.46, y);
        ctx.lineTo(x + w * 0.54, y);
        ctx.closePath();
        ctx.fill();
      }

      const cols = Math.max(2, Math.floor(w / 13));
      const rows = Math.max(2, Math.floor(h / 15));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (random() > (isNight ? 0.48 : 0.78)) {
            const wx = x + 6 + col * ((w - 12) / cols);
            const wy = y + 8 + row * ((h - 16) / rows);
            ctx.globalAlpha = isNight ? 0.7 + random() * 0.3 : 0.18;
            ctx.fillStyle = isNight && random() > 0.32 ? '#f3c979' : '#b8d0dc';
            ctx.fillRect(wx, wy, 3.2, 5.2);
          }
        }
      }
      ctx.globalAlpha = 1;
      x += w + 4 + random() * 8 + layerIndex * 2;
    }
  });

  const waterTop = horizon + 8;
  const water = ctx.createLinearGradient(0, waterTop, 0, height);
  if (isNight) {
    water.addColorStop(0, '#182638');
    water.addColorStop(1, '#070b12');
  } else {
    water.addColorStop(0, weather === 'rain' ? '#8ea0a4' : '#789ca6');
    water.addColorStop(1, '#3f5a61');
  }
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = water;
  ctx.fillRect(0, waterTop, width, height - waterTop);
  ctx.globalAlpha = 1;

  for (let i = 0; i < 190; i++) {
    const x = random() * width;
    const y = waterTop + random() * (height - waterTop);
    const len = 4 + random() * 24;
    ctx.strokeStyle = isNight
      ? `rgba(${random() > 0.35 ? '240,194,108' : '139,183,217'},${0.05 + random() * 0.2})`
      : `rgba(230,239,237,${0.035 + random() * 0.11})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }

  if (weather === 'rain') {
    ctx.fillStyle = 'rgba(91,107,117,.12)';
    ctx.fillRect(0, 0, width, height);
  }
  if (weather === 'snow' || season === 'winter') {
    ctx.fillStyle = 'rgba(236,239,239,.06)';
    ctx.fillRect(0, 0, width, height);
  }

  const vignette = ctx.createRadialGradient(width / 2, height * 0.45, height * 0.15, width / 2, height * 0.45, width * 0.62);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
