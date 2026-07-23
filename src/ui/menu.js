import { $ } from '../utils.js';
import { STAGES } from '../data/stages.js';
import { save, stageUnlocked } from '../save.js';
import { paintStageThumb } from '../render/paint.js';
import { startBattle } from '../battle/engine.js';

export function buildMenu() {
  $('#gold-menu').textContent = save.gold;
  const tr = $('#stage-track');
  tr.innerHTML = '';
  STAGES.forEach((st, i) => {
    const un = stageUnlocked(i);
    const d = document.createElement('div');
    d.className = 'stage-card' + (un ? '' : ' locked');
    d.innerHTML = `<div class="chap">${st.chap}</div><div class="sname">${st.name}</div>
      <div class="ssub">${st.sub}</div><canvas></canvas>
      <div class="boss-line">章末之敵 <b>${st.boss.name}</b></div>
      <div class="stage-stars">${'★'.repeat(save.stars[i])}${'☆'.repeat(Math.max(0, 3 - save.stars[i]))}</div>`;
    paintStageThumb(d.querySelector('canvas'), i);
    if (un) d.onclick = () => startBattle(i);
    tr.appendChild(d);
  });
}
