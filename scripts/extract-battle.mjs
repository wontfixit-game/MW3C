import fs from 'fs';

const src = fs.readFileSync('c:/Users/hklo428/Downloads/墨魂三國.html', 'utf8');
const m = src.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('no script');
const code = m[1];
const start = code.indexOf('const VW=960');
const end = code.indexOf('/* ---------- 啟動 ---------- */');
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`);
let battle = code.slice(start, end);

const header = `import { $, clamp, rnd, TAU } from '../utils.js';
import { CHARS, chStat } from '../data/chars.js';
import { STAGES, eMul } from '../data/stages.js';
import { save, persist } from '../save.js';
import { initAudio, sfx } from '../audio.js';
import { inkStroke, inkBlob, mulberry, drawMountains } from '../render/ink.js';
import { drawChibi } from '../render/chibi.js';
import { paintTitle } from '../render/paint.js';
import { goto } from '../ui/screens.js';

let onReturnMenu = () => {};
export function setBattleHooks({ onReturnMenu: fn } = {}) {
  if (fn) onReturnMenu = fn;
}

`;

battle = battle.replace(
  "$('#btn-return').onclick=()=>{stopBattle();goto('#scr-menu');buildMenu();};",
  "$('#btn-return').onclick=()=>{stopBattle();onReturnMenu();};",
);
battle = battle.replace(
  "$('#btn-quit').onclick=()=>{stopBattle();goto('#scr-menu');buildMenu();};",
  "$('#btn-quit').onclick=()=>{stopBattle();onReturnMenu();};",
);
battle = battle.replace('function startBattle(idx){', 'export function startBattle(idx){');
battle = battle.replace('function stopBattle(){', 'export function stopBattle(){');
battle = battle.replace('function fitCanvas(){', 'export function fitCanvas(){');

const out = header + '\n' + battle + '\n';
fs.mkdirSync('c:/Users/hklo428/Documents/mohun-sanguo/src/battle', { recursive: true });
fs.writeFileSync('c:/Users/hklo428/Documents/mohun-sanguo/src/battle/engine.js', out);
console.log('wrote', out.length, 'chars');
