import { rnd, TAU } from '../utils.js';

export function inkStroke(ctx, pts, w, alpha = 1, color = '#1B1611') {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let p = 0; p < 2; p++) {
    ctx.lineWidth = w * (p ? 0.45 : 1);
    ctx.globalAlpha = alpha * (p ? 0.5 : 1);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const j = p ? 1.2 : 0;
      ctx.lineTo(pts[i][0] + rnd(-j, j), pts[i][1] + rnd(-j, j));
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function inkBlob(ctx, x, y, r, alpha, color = '#1B1611') {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = i / n * TAU;
    const rr = r * rnd(0.75, 1.15);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function drawMountains(ctx, w, h, seed, tint) {
  const R = mulberry(seed);
  for (let layer = 0; layer < 3; layer++) {
    const base = h * (0.52 + layer * 0.13);
    const amp = h * (0.22 - layer * 0.05);
    ctx.save();
    ctx.globalAlpha = 0.10 + layer * 0.07;
    ctx.fillStyle = layer === 2 ? tint : '#1B1611';
    ctx.beginPath();
    ctx.moveTo(-20, h);
    let x = -20;
    while (x < w + 40) {
      ctx.lineTo(x, base - Math.abs(Math.sin(x * 0.004 + seed + layer * 3)) * amp * (0.5 + R() * 0.8));
      x += 30 + R() * 50;
    }
    ctx.lineTo(w + 40, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
