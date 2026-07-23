export const CHARS = {
  zhaoyun: {
    name: '趙雲', title: '常山之龍', weapon: '龍膽槍', hp: 520, atk: 46, spd: 1,
    color: '#3E5C76', accent: '#9FB8CC', hair: '#20242c', wtype: 'spear',
    combo: [1, 1, 1.15, 1.75],
    skill: { name: '龍膽七探', mult: 6.2, radius: 320, desc: '化槍為龍，貫穿當前戰場全敵' },
    unlock: 0, hint: '初始武將',
  },
  guanyu: {
    name: '關羽', title: '美髯忠魂', weapon: '偃月刀', hp: 680, atk: 60, spd: 0.86,
    color: '#2F5238', accent: '#B8442F', hair: '#141210', wtype: 'guandao',
    combo: [1.35, 1.35, 2.3],
    skill: { name: '青龍偃月斬', mult: 8.2, radius: 260, desc: '一刀既出，青龍裂地' },
    unlock: 2, hint: '通關 第二章 解鎖', beard: true,
  },
  diaochan: {
    name: '貂蟬', title: '月下舞姬', weapon: '雙飛袖刃', hp: 430, atk: 35, spd: 1.15,
    color: '#8E3B52', accent: '#E3A8B6', hair: '#241418', wtype: 'ribbon',
    combo: [0.72, 0.72, 0.72, 0.72, 1.5],
    skill: { name: '落雁亂舞', mult: 5.6, radius: 360, desc: '袖影如雁陣，亂舞席捲四方' },
    unlock: 3, hint: '通關 第三章 解鎖',
  },
};

export const chStat = (k, lv) => {
  const c = CHARS[k];
  const m = 1 + 0.14 * (lv - 1);
  return { hp: Math.round(c.hp * m), atk: Math.round(c.atk * m) };
};

export const lvCost = (lv) => Math.floor(80 * Math.pow(lv, 1.6));
export const MAXLV = 20;
