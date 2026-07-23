import { $ } from './utils.js';
import { CHARS } from './data/chars.js';

const SAVE_KEY = 'mohun_sanguo_save_v1';

const defaultSave = () => ({
  gold: 120,
  sel: 'zhaoyun',
  sub: 'guanyu',
  stars: [0, 0, 0, 0, 0],
  chars: {
    zhaoyun: { lv: 1, un: 1 },
    guanyu: { lv: 1, un: 1 },
    diaochan: { lv: 1, un: 0 },
  },
});

export let save = defaultSave();

/** 依 CHARS.unlock 與通關星數同步解鎖；並保證開局至少雙人可編制 */
function syncUnlocks() {
  Object.keys(CHARS).forEach((k) => {
    const need = CHARS[k].unlock | 0;
    if (!save.chars[k]) save.chars[k] = { lv: 1, un: 0 };
    if (need <= 0) save.chars[k].un = 1;
    // 已通關足夠章節也解鎖（idx+1 >= unlock → stars 上有通關記錄）
    if (need > 0) {
      const cleared = save.stars.filter((s) => s > 0).length;
      if (cleared >= need) save.chars[k].un = 1;
      // 舊規則：通關第 (unlock) 章 → stars[unlock-1]
      if (need >= 1 && save.stars[need - 1] > 0) save.chars[k].un = 1;
    }
  });
  // 關羽固定為可選副將（舊存檔遷移）
  if (save.chars.guanyu) save.chars.guanyu.un = 1;
}

function normalizeParty() {
  syncUnlocks();
  if (!save.chars[save.sel]?.un) save.sel = 'zhaoyun';
  if (save.sub && (!save.chars[save.sub]?.un || save.sub === save.sel)) save.sub = null;
  // 若尚未編副將，自動帶上第一個非主將的已解鎖武將
  if (!save.sub) {
    const other = Object.keys(CHARS).find((k) => k !== save.sel && save.chars[k]?.un);
    if (other) save.sub = other;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      normalizeParty();
      return;
    }
    const d = JSON.parse(raw);
    save = { ...defaultSave(), ...d, chars: { ...defaultSave().chars, ...(d.chars || {}) } };
    normalizeParty();
  } catch {
    normalizeParty();
  }
}

let saveTimer = null;
export function persist() {
  normalizeParty();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      /* quota / private mode */
    }
  }, 250);
}

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.opacity = 0; }, 2200);
}

export function stageUnlocked(i) {
  return i === 0 || save.stars[i - 1] > 0;
}

/** 出戰編制：主將必有，副將可空 */
export function getPartyKeys() {
  normalizeParty();
  return { main: save.sel, sub: save.sub };
}
