import { $ } from '../utils.js';
import { CHARS } from '../data/chars.js';
import { STAGES } from '../data/stages.js';
import { inkStroke, inkBlob, drawMountains } from './ink.js';
import { drawChibi } from './chibi.js';

export function paintTitle() {
  const c = $('#title-art');
  const w = c.width = innerWidth * devicePixelRatio;
  const h = c.height = innerHeight * devicePixelRatio;
  c.style.width = innerWidth + 'px';
  c.style.height = innerHeight + 'px';
  const ctx = c.getContext('2d');
  drawMountains(ctx, w, h, 7, '#5a6472');
  ctx.strokeStyle = '#1B1611';
  ctx.lineWidth = 2 * devicePixelRatio;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 5; i++) {
    const bx = w * 0.62 + i * 26 * devicePixelRatio;
    const by = h * 0.18 + Math.sin(i) * 10;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by);
    ctx.quadraticCurveTo(bx, by - 6, bx + 8, by);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const s = devicePixelRatio * (Math.min(innerWidth, 900) / 900) * 2.2;
  drawChibi(ctx, w * 0.16, h * 0.9, 1, 'idle', CHARS.zhaoyun, { t: 1.2, scale: s });
  drawChibi(ctx, w * 0.86, h * 0.92, -1, 'idle', CHARS.guanyu, { t: 0.4, scale: s * 1.05 });
  ctx.save();
  ctx.translate(w * 0.92, h * 0.12);
  ctx.rotate(0.06);
  ctx.fillStyle = '#A5302A';
  ctx.fillRect(-22 * devicePixelRatio, -22 * devicePixelRatio, 44 * devicePixelRatio, 44 * devicePixelRatio);
  ctx.fillStyle = '#EAE2CE';
  ctx.font = `${17 * devicePixelRatio}px "Noto Serif TC",serif`;
  ctx.textAlign = 'center';
  ctx.fillText('墨', 0, -3 * devicePixelRatio);
  ctx.fillText('魂', 0, 15 * devicePixelRatio);
  ctx.restore();
}

export function paintStageThumb(cv, i) {
  const st = STAGES[i];
  const w = cv.width = 300;
  const h = cv.height = 110;
  const ctx = cv.getContext('2d');
  drawMountains(ctx, w, h, 11 + i * 13, st.tint);
  ctx.fillStyle = '#1B1611';
  ctx.globalAlpha = 0.75;
  ctx.fillRect(0, h - 8, w, 3);
  ctx.globalAlpha = 1;
  const en = { color: '#3a352c', accent: '#C9A02C', hair: '#20242c', wtype: 'spear' };
  drawChibi(ctx, w * 0.68, h - 8, -1, 'idle', en, { t: i, scale: 0.75, turban: i < 2 });
  if (i >= 3) drawChibi(ctx, w * 0.84, h - 8, -1, 'idle', en, { t: i + 2, scale: 0.75, brute: true });
  ctx.save();
  ctx.translate(w * 0.12, h - 8);
  inkStroke(ctx, [[0, 0], [0, -70]], 3, 1);
  ctx.fillStyle = st.tint;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.lineTo(52, -62);
  ctx.lineTo(0, -46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function paintPortrait(cv, key, pose = 'idle') {
  const w = cv.width = 170;
  const h = cv.height = 170;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  inkBlob(ctx, w / 2, h * 0.62, 52, 0.08);
  drawChibi(ctx, w / 2, h * 0.88, 1, pose, CHARS[key], { t: 2.2, scale: 1.55 });
}
