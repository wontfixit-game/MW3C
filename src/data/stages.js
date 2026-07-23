export const STAGES = [
  {
    chap: '第一章', name: '黃巾之亂', sub: '潁川・野原烽煙', len: 2300, tint: '#7a6f4d',
    waves: [['s', 's'], ['s', 's', 'a'], ['s', 'a', 'b']],
    boss: { name: '程遠志', hp: 850, atk: 30, scale: 1.3, color: '#6b5b2e', pat: 2 }, gold: 140,
  },
  {
    chap: '第二章', name: '汜水關前', sub: '關隘・旌旗蔽日', len: 2500, tint: '#5c6b5a',
    waves: [['s', 's', 's'], ['a', 'a', 's'], ['b', 'b', 'a']],
    boss: { name: '華雄', hp: 1400, atk: 40, scale: 1.4, color: '#54402c', pat: 2 }, gold: 220,
  },
  {
    chap: '第三章', name: '虎牢晨霧', sub: '虎牢關・霧鎖雄關', len: 2700, tint: '#5a6472',
    waves: [['s', 'a', 'b'], ['s', 's', 'a', 'a'], ['b', 's', 's', 'a']],
    boss: { name: '董卓', hp: 2100, atk: 50, scale: 1.55, color: '#4a3540', pat: 2 }, gold: 320,
  },
  {
    chap: '第四章', name: '長安動亂', sub: '長安・火照宮牆', len: 2900, tint: '#77524a',
    waves: [['b', 'a', 'a', 's'], ['s', 's', 'b', 'a'], ['b', 'b', 'a', 'a']],
    boss: { name: '李傕', hp: 2900, atk: 60, scale: 1.45, color: '#5e3630', pat: 3 }, gold: 450,
  },
  {
    chap: '終章', name: '虎牢決戰', sub: '虎牢關・人中呂布', len: 3100, tint: '#3d3a45',
    waves: [['b', 's', 's', 'a', 'a'], ['b', 'b', 'a', 's'], ['s', 's', 's', 'b', 'b', 'a']],
    boss: { name: '呂布', hp: 4600, atk: 74, scale: 1.7, color: '#2c2733', pat: 3, lubu: true }, gold: 700,
  },
];

export const eMul = (i) => 1 + i * 0.5;
