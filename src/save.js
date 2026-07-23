import { $ } from './utils.js';

const SAVE_KEY = 'mohun_sanguo_save_v1';

const defaultSave = () => ({
  gold: 120,
  sel: 'zhaoyun',
  stars: [0, 0, 0, 0, 0],
  chars: {
    zhaoyun: { lv: 1, un: 1 },
    guanyu: { lv: 1, un: 0 },
    diaochan: { lv: 1, un: 0 },
  },
});

export let save = defaultSave();

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    save = { ...defaultSave(), ...d, chars: { ...defaultSave().chars, ...(d.chars || {}) } };
  } catch {
    /* 無存檔或損壞 */
  }
}

let saveTimer = null;
export function persist() {
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
