import { clamp, TAU } from '../utils.js';
import { inkStroke, inkBlob } from './ink.js';

/** Q版水墨角色
 * pose: idle run lunge strike dash air hurt tele stun cast
 * opt: {t,combo,face,scale,enemy,turban,bow,brute,rage,flash,st}
 */
export function drawChibi(ctx, x, y, face, pose, ch, opt = {}) {
  const t = opt.t || 0;
  const sc = opt.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face * sc, sc);
  const ink = '#1B1611';
  const bob = pose === 'idle' ? Math.sin(t * 4) * 1.5 : 0;
  const runc = pose === 'run' ? Math.sin(t * 16) : 0;
  let lean = 0;
  if (pose === 'run') lean = 0.12;
  if (pose === 'lunge' || pose === 'dash') lean = 0.32;
  if (pose === 'hurt') lean = -0.25;
  if (pose === 'cast') lean = -0.08;
  ctx.rotate(lean);
  ctx.translate(0, bob);
  ctx.save();
  ctx.rotate(-lean);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, 2 - bob, 20 * sc > 18 ? 18 : 16, 4, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  const legA = pose === 'run' ? runc * 0.7 : (pose === 'air' ? -0.5 : 0);
  inkStroke(ctx, [[-3, -16], [-5 + Math.sin(legA) * 7, 0]], 4.4, 1, ink);
  inkStroke(ctx, [[3, -16], [5 - Math.sin(legA) * 7, pose === 'air' ? -6 : 0]], 4.4, 1, ink);
  ctx.save();
  ctx.fillStyle = ch.color;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(-9, -34);
  ctx.quadraticCurveTo(-13, -18, -8, -14);
  ctx.lineTo(8, -14);
  ctx.quadraticCurveTo(13, -18, 9, -34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  inkStroke(ctx, [[-9, -34], [-12, -20], [-8, -14]], 2, 0.8, ink);
  inkStroke(ctx, [[9, -34], [12, -20], [8, -14]], 2, 0.8, ink);
  ctx.fillStyle = ch.accent;
  ctx.fillRect(-9, -22, 18, 3.4);
  const hy = -46;
  ctx.save();
  ctx.fillStyle = '#F2EAD6';
  ctx.beginPath();
  ctx.arc(0, hy, 13, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = opt.turban ? '#C9A02C' : ch.hair;
  ctx.beginPath();
  ctx.arc(0, hy - 2, 13, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  if (opt.turban) ctx.fillRect(-13, hy - 6, 26, 4);
  if (ch.wtype === 'ribbon') {
    ctx.beginPath();
    ctx.arc(-9, hy - 12, 4.5, 0, TAU);
    ctx.arc(9, hy - 12, 4.5, 0, TAU);
    ctx.fill();
  }
  if (ch.beard) {
    ctx.save();
    ctx.strokeStyle = '#141210';
    ctx.lineWidth = 1.6;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 1.7, hy + 9);
      ctx.quadraticCurveTo(i * 2.4, hy + 22, i * 1.9, hy + 30);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.fillStyle = ink;
  if (pose === 'stun') {
    ctx.font = '10px serif';
    ctx.fillText('✕', 2, hy + 2);
  } else {
    ctx.beginPath();
    ctx.arc(5, hy - 1, 1.8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, hy - 1, 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  const wcol = opt.rage ? '#A5302A' : ink;
  function spear(swing) {
    ctx.save();
    ctx.translate(6, -26);
    ctx.rotate(swing);
    inkStroke(ctx, [[0, 0], [34, 0]], 3, 1, wcol);
    ctx.fillStyle = '#cfd6dd';
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(46, -3);
    ctx.lineTo(46, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ch.accent;
    ctx.fillRect(31, -3, 3, 6);
    ctx.restore();
  }
  function guandao(swing) {
    ctx.save();
    ctx.translate(5, -26);
    ctx.rotate(swing);
    inkStroke(ctx, [[0, 6], [38, -4]], 3.4, 1, wcol);
    ctx.fillStyle = '#9aa8a0';
    ctx.beginPath();
    ctx.moveTo(36, -4);
    ctx.quadraticCurveTo(56, -14, 50, 4);
    ctx.quadraticCurveTo(44, 0, 36, -1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function ribbon(swing) {
    ctx.save();
    ctx.translate(4, -28);
    ctx.rotate(swing * 0.6);
    ctx.strokeStyle = ch.accent;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(18, -14 + Math.sin(t * 9) * 6, 34, 6, 46, -8 + Math.cos(t * 7) * 6);
    ctx.stroke();
    ctx.restore();
  }
  function club(swing) {
    ctx.save();
    ctx.translate(6, -26);
    ctx.rotate(swing);
    inkStroke(ctx, [[0, 0], [26, -4]], 5, 1, wcol);
    inkBlob(ctx, 30, -5, 8, 0.95, '#4a4238');
    ctx.restore();
  }
  function bow() {
    ctx.save();
    ctx.translate(8, -28);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 14, -1.2, 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(-1.2) * 14, Math.sin(-1.2) * 14);
    ctx.lineTo(Math.cos(1.2) * 14, Math.sin(1.2) * 14);
    ctx.stroke();
    ctx.restore();
  }
  let swing = 0;
  if (pose === 'strike') {
    const p = clamp((opt.st || 0) / 0.16, 0, 1);
    swing = -1.5 + p * 2.4 + ((opt.combo || 0) % 2 ? -0.3 : 0.2);
  } else if (pose === 'lunge') swing = -1.2;
  else if (pose === 'tele') swing = -1.7 + Math.sin(t * 30) * 0.06;
  else if (pose === 'cast') swing = -2.2;
  else swing = -0.35 + Math.sin(t * 3) * 0.05;
  const w = opt.bow ? 'bow' : (opt.brute ? 'club' : (ch.wtype || 'spear'));
  inkStroke(ctx, [[-7, -30], [-13, -22 + runc * 3]], 4, 1, ink);
  if (w === 'spear') spear(swing);
  else if (w === 'guandao') guandao(swing);
  else if (w === 'ribbon') ribbon(swing);
  else if (w === 'club') club(swing);
  else bow();
  inkStroke(ctx, [[7, -30], [10, -24]], 4, 1, ink);
  if (pose === 'tele') {
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(t * 26) * 0.18;
    ctx.fillStyle = '#A5302A';
    ctx.beginPath();
    ctx.arc(0, -30, 30, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  if (opt.flash) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#fff';
    ctx.fillRect(-30, -70, 60, 80);
    ctx.restore();
  }
  ctx.restore();
}
