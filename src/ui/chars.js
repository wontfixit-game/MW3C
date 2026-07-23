import { $ } from '../utils.js';
import { CHARS, chStat, lvCost, MAXLV } from '../data/chars.js';
import { save, persist, toast } from '../save.js';
import { paintPortrait } from '../render/paint.js';

export function buildChars() {
  $('#gold-chars').textContent = save.gold;
  const list = $('#char-list');
  list.innerHTML = '';

  const mainName = CHARS[save.sel]?.name || '—';
  const subName = save.sub ? (CHARS[save.sub]?.name || '—') : '未編制';
  const banner = document.createElement('div');
  banner.className = 'party-banner';
  banner.innerHTML = `主將 <b>${mainName}</b>　·　副將 <b>${subName}</b><span class="party-hint">戰鬥中可切換（需副將）</span>`;
  list.appendChild(banner);

  Object.keys(CHARS).forEach((k) => {
    const c = CHARS[k];
    const sv = save.chars[k];
    const un = sv.un;
    const stat = chStat(k, sv.lv);
    const next = chStat(k, sv.lv + 1);
    const cost = lvCost(sv.lv);
    const isMain = save.sel === k;
    const isSub = save.sub === k;
    const d = document.createElement('div');
    d.className = 'char-card'
      + (isMain ? ' selected' : '')
      + (isSub ? ' sub-selected' : '')
      + (un ? '' : ' locked-char');
    d.innerHTML = `<canvas></canvas>
      <div class="cname">${c.name}${isMain ? '<span class="role-tag main">主</span>' : ''}${isSub ? '<span class="role-tag sub">副</span>' : ''}</div>
      <div class="ctitle">${c.title}・${c.weapon}</div>
      <div class="cstat">修為 <b>Lv.${sv.lv}</b>${sv.lv >= MAXLV ? '（圓滿）' : ''}<br>
        氣血 <b>${stat.hp}</b>${sv.lv < MAXLV ? `<span style="color:var(--jade)"> →${next.hp}</span>` : ''}　
        武力 <b>${stat.atk}</b>${sv.lv < MAXLV ? `<span style="color:var(--jade)"> →${next.atk}</span>` : ''}<br>
        身法 ${'●'.repeat(Math.round(c.spd * 3))}${'○'.repeat(4 - Math.round(c.spd * 3))}　
        連段 ${c.combo.length} 式</div>
      <div class="cskill">奧義【${c.skill.name}】— ${c.skill.desc}</div>
      ${un ? '' : '<span class="seal lockhint">封印</span>'}
      <div class="char-actions">
        <button class="primary" data-act="main" ${!un || isMain ? 'disabled' : ''}>${isMain ? '主將中' : '設為主將'}</button>
        <button class="sub" data-act="sub" ${!un || isMain || isSub ? 'disabled' : ''}>${isSub ? '副將中' : '設為副將'}</button>
        <button class="lvup" data-act="lv" ${!un || sv.lv >= MAXLV || save.gold < cost ? 'disabled' : ''}>${sv.lv >= MAXLV ? '已圓滿' : `修行 金${cost}`}</button>
      </div>
      ${un ? '' : `<div style="font-size:12px;color:var(--seal);letter-spacing:.1em;text-align:center">${c.hint}</div>`}`;
    paintPortrait(d.querySelector('canvas'), k);
    d.querySelectorAll('.char-actions button').forEach((btn) => {
      btn.onclick = () => {
        const act = btn.dataset.act;
        if (act === 'main') {
          if (save.sub === k) save.sub = null;
          save.sel = k;
          persist();
          buildChars();
          toast(`${c.name} 為主將`);
        } else if (act === 'sub') {
          if (save.sel === k) return;
          save.sub = k;
          persist();
          buildChars();
          toast(`${c.name} 為副將`);
        } else if (act === 'lv') {
          if (save.gold < cost) return;
          save.gold -= cost;
          save.chars[k].lv++;
          persist();
          buildChars();
          toast(`${c.name} 修為精進 Lv.${save.chars[k].lv}`);
        }
      };
    });
    list.appendChild(d);
  });
}
