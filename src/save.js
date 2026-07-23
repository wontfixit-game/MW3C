import { $ } from './utils.js';

const SAVE_KEY = 'mohun_sanguo_save_v1';

const defaultSave = () => ({
  gold: 120,
  sel: 'zhaoyun',
  sub: null,
  stars: [0, 0, 0, 0, 0],
  chars: {
    zhaoyun: { lv: 1, un: 1 },
    guanyu: { lv: 1, un: 0 },
    diaochan: { lv: 1, un: 0 },
  },
});

export let save = defaultSave();

function normalizeParty() {
  if (!save.chars[save.sel]?.un) save.sel = 'zhaoyun';
  if (save.sub && (!save.chars[save.sub]?.un || save.sub === save.sel)) save.sub = null;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    save = { ...defaultSave(), ...d, chars: { ...defaultSave().chars, ...(d.chars || {}) } };
    normalizeParty();
  } catch {
    /* 無存檔或損壞 */
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
