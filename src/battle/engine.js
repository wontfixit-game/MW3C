import { $, clamp, rnd, TAU } from '../utils.js';
import { CHARS, chStat } from '../data/chars.js';
import { STAGES, eMul } from '../data/stages.js';
import { save, persist, getPartyKeys } from '../save.js';
import { initAudio, sfx } from '../audio.js';
import { inkStroke, inkBlob, mulberry, drawMountains } from '../render/ink.js';
import { drawChibi } from '../render/chibi.js';
import { paintTitle } from '../render/paint.js';
import { goto } from '../ui/screens.js';

let onReturnMenu = () => {};
export function setBattleHooks({ onReturnMenu: fn } = {}) {
  if (fn) onReturnMenu = fn;
}


const VW=960,VH=540,GY=458;
const cv=$('#game'),ctx=cv.getContext('2d');
export function fitCanvas(){
  const w=innerWidth,h=innerHeight,r=Math.min(w/VW,h/VH);
  cv.width=VW*devicePixelRatio*r|0;cv.height=VH*devicePixelRatio*r|0;
  cv.style.width=VW*r+'px';cv.style.height=VH*r+'px';
  ctx.setTransform(devicePixelRatio*r,0,0,devicePixelRatio*r,0,0);
  cv._scale=r;
}
addEventListener('resize',()=>{fitCanvas();paintTitle();});

let B=null,P=null,lastT=0,rafId=0;

const SWITCH_CD = 9;

function mkMember(key) {
  const sv = save.chars[key];
  const c = CHARS[key];
  const stat = chStat(key, sv.lv);
  return { key, ch: c, lv: sv.lv, hp: stat.hp, maxHp: stat.hp, atk: stat.atk, spd: c.spd };
}

export function startBattle(idx) {
  const st = STAGES[idx];
  const { main, sub } = getPartyKeys();
  const members = { [main]: mkMember(main) };
  if (sub) members[sub] = mkMember(sub);
  const m = members[main];
  P = {
    key: main, ch: m.ch, x: 180, y: GY, vx: 0, vy: 0, face: 1,
    hp: m.hp, maxHp: m.maxHp, atk: m.atk, spd: m.spd,
    state: 'idle', stT: 0, combo: 0, comboT: 0, comboCount: 0, sp: 0, inv: 0, air: false,
    target: null, anim: Math.random() * 9, queued: null, hurtF: 0,
  };
  const zones = [];
  const total = st.waves.length + 1;
  for (let i = 0; i < total; i++) zones.push(340 + (st.len - 680) * (i / (total - 1)));
  B = {
    idx, st, zones, wave: -1, enemies: [], projs: [], fx: [], texts: [],
    cam: 0, shake: 0, ts: 1, tsT: 0, hstop: 0, state: 'run', time: 0, over: false,
    bannerT: 0, banner: '', autoRun: true, bossOn: false,
    party: { main, sub, members, switchCd: 0 },
  };
  $('#hp-name').textContent = `${m.ch.name}　Lv.${m.lv}`;
  $('#boss-wrap').style.display = 'none';
  $('#combo-tag').style.opacity = 0;
  $('#ov-result').classList.remove('show');
  $('#ov-pause').classList.remove('show');
  updHUD();
  goto('#scr-battle');
  fitCanvas();
  showBanner(`${st.chap}・${st.name}`);
  lastT = performance.now();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}
function showBanner(txt){B.banner=txt;B.bannerT=1.6;}

/* ---------- 敵人工廠 ---------- */
function mkEnemy(type,x,idx){
  const m=eMul(idx);
  const base={x,y:GY,vx:0,vy:0,face:-1,state:'idle',stT:rnd(0,.5),anim:rnd(0,9),
    air:false,hurtF:0,stun:0,type,boss:false,armor:0,cool:rnd(.2,1)};
  if(type==='s')return{...base,hp:70*m,maxHp:70*m,atk:12*m,spd:95,range:74,tele:.55,name:'黃巾兵',
    ch:{color:'#3f3a2e',accent:'#C9A02C',hair:'#20242c',wtype:'spear'},turban:true,scale:.92,gold:8};
  if(type==='a')return{...base,hp:52*m,maxHp:52*m,atk:10*m,spd:85,range:400,tele:.7,name:'弓兵',
    ch:{color:'#4a4436',accent:'#8C6B2F',hair:'#20242c',wtype:'spear'},bow:true,scale:.9,keep:340,gold:10};
  return{...base,hp:190*m,maxHp:190*m,atk:20*m,spd:55,range:104,tele:.85,name:'力士',
    ch:{color:'#33302b',accent:'#6b5b2e',hair:'#141210',wtype:'spear'},brute:true,armor:2,scale:1.28,gold:16};
}
function mkBoss(idx){
  const b=STAGES[idx].boss;
  return{x:B.zones[B.zones.length-1]+220,y:GY,vx:0,vy:0,face:-1,state:'idle',stT:.8,anim:0,
    air:false,hurtF:0,stun:0,boss:true,armor:1,cool:1.2,name:b.name,
    hp:b.hp,maxHp:b.hp,atk:b.atk,spd:120,range:120,tele:.8,pat:b.pat,lubu:!!b.lubu,rage:false,
    ch:{color:b.color,accent:'#A5302A',hair:'#141210',wtype:b.lubu?'spear':'guandao'},scale:b.scale,gold:0};
}
function spawnWave(){
  B.wave++;
  if(B.wave<B.st.waves.length){
    const zx=B.zones[B.wave];
    B.st.waves[B.wave].forEach((t,i)=>{
      const e=mkEnemy(t,zx+120+i*70+rnd(-20,20),B.idx);
      B.enemies.push(e);
      fxInk(e.x,GY-30,1.2,'#1B1611');
    });
    showBanner(`第 ${['一','二','三','四','五','六'][B.wave]} 陣`);
  }else{
    const bo=mkBoss(B.idx);B.enemies.push(bo);B.bossOn=true;
    $('#boss-wrap').style.display='block';
    $('#boss-name').textContent=`章末之敵・${bo.name}`;
    showBanner(`⚔ ${bo.name} 現身`);
    sfx('hurt');
  }
}

/* ---------- 特效 ---------- */
function fxInk(x,y,s=1,color='#1B1611'){
  for(let i=0;i<7;i++)B.fx.push({t:0,life:rnd(.4,.8),type:'blob',x,y,color,
    vx:rnd(-160,160)*s,vy:rnd(-260,-40)*s,r:rnd(3,9)*s});
}
function fxSlash(x,y,ang,s=1,color='#1B1611'){
  B.fx.push({t:0,life:.14,type:'slash',x,y,ang,s,color});
}
function fxRing(x,y,color='#A5302A'){B.fx.push({t:0,life:.4,type:'ring',x,y,color});}
function fxText(x,y,str,color='#1B1611',size=17){
  B.texts.push({t:0,life:.75,x:x+rnd(-8,8),y,str,color,size});
}

/* ---------- 傷害處理 ---------- */
function dmgEnemy(e,amount,opt={}){
  if(e.hp<=0)return;
  // 見切判定：敵方蓄招中被打
  let parried=false;
  if(e.state==='tele'&&!opt.noParry){
    parried=true;parryTrigger(e);amount*=1.5;
  }
  e.hp-=amount;e.hurtF=.08;
  fxText(e.x,e.y-70*e.scale,Math.round(amount),opt.crit?'#A5302A':'#1B1611',opt.crit?21:16);
  fxInk(e.x,e.y-34,.8);
  P.sp=clamp(P.sp+3,0,100);
  B.hstop=Math.min(0.12, Math.max(B.hstop,opt.hstop||.05));
  B.shake=Math.max(B.shake,opt.shake||3);
  sfx('hit');
  if(e.hp<=0){killEnemy(e);return;}
  if(parried){ /* 見切定身：維持長硬直，開啟追擊窗口 */ }
  else if(e.armor>0&&!opt.pierce){ /* 霸體：不硬直 */ }
  else{
    e.state='hurt';e.stT=.26;e.stun=0;
    e.vx=(opt.kx||140)*(P.x<e.x?1:-1);
    if(opt.launch){e.vy=-540;e.air=true;e.y-=2;}
    else if(e.air){e.vy=-190;} // 浮空維持
  }
}
function killEnemy(e){
  e.hp=0;e.state='dead';e.stT=.5;
  for(let i=0;i<14;i++)B.fx.push({t:0,life:rnd(.5,1),type:'blob',x:e.x,y:e.y-30,
    color:'#1B1611',vx:rnd(-240,240),vy:rnd(-380,-60),r:rnd(3,10)*e.scale});
  fxRing(e.x,e.y-30,'#1B1611');
  save.gold+=e.gold;if(e.gold)fxText(e.x,e.y-90,`金+${e.gold}`,'#8C6B2F',14);
  P.sp=clamp(P.sp+6,0,100);
  B.shake=Math.max(B.shake,5);
}
function dmgPlayer(amount,fromX){
  if(P.inv>0||B.state!=='run')return;
  P.hp-=amount;P.hurtF=.12;P.state='hurt';P.stT=.32;P.combo=0;P.queued=null;
  P.vx=180*(fromX>P.x?-1:1);P.inv=.6;
  fxInk(P.x,P.y-34,1,'#A5302A');
  fxText(P.x,P.y-80,Math.round(amount),'#A5302A',18);
  B.shake=Math.max(B.shake,6);sfx('hurt');
  updHUD();
  if(P.hp<=0){P.hp=0;endBattle(false);}
}
function parryTrigger(e){
  e.state='stun';e.stT=1.35;e.stun=1;e.vx=0;
  P.sp=clamp(P.sp+22,0,100);
  B.ts=.22;B.tsT=.75;
  fxRing(P.x+(e.x-P.x)/2,P.y-46);
  fxText(P.x+(e.x-P.x)/2,P.y-108,'見切！','#A5302A',26);
  sfx('parry');
}

/* ---------- 玩家動作 ---------- */
function nearestEnemy(maxD,dir=0){
  let best=null,bd=1e9;
  for(const e of B.enemies){
    if(e.hp<=0)continue;
    const dx=e.x-P.x;
    if(dir&&Math.sign(dx)!==dir&&Math.abs(dx)>60)continue;
    const d=Math.abs(dx)+Math.abs((e.y-e.scale*30)-(P.y-30))*.6;
    if(d<maxD&&d<bd){bd=d;best=e;}
  }
  return best;
}
function tryAttack(dirHint=0){
  if(B.state!=='run')return;
  if(P.state==='hurt'||P.state==='cast')return;
  if(P.state==='strike'||P.state==='lunge'){P.queued={dir:dirHint};return;}
  const t=nearestEnemy(460,dirHint);
  P.comboT=1.0;
  if(t){
    P.target=t;P.state='lunge';P.stT=.35;P._lungeAge=0;
    P.face=t.x>P.x?1:-1;sfx('dash');
  }
  else{P.state='strike';P.stT=.16;P.face=dirHint||P.face;P._hitDone=false;}
}
function tryDash(dir){
  if(B.state!=='run')return;
  if(P.state==='cast')return;
  // 受擊後半／撲攻／出招皆可疾衝取消，避免黏住
  if(P.state==='hurt'&&P.stT>0.16)return;
  P.state='dash';P.stT=.2;P.face=dir;P.vx=dir*860;P.inv=Math.max(P.inv,.24);
  P.queued=null;P.target=null;
  for(let i=0;i<4;i++)B.fx.push({t:0,life:.3,type:'streak',x:P.x-dir*i*14,y:P.y-30-i*3,dir});
  sfx('dash');
}
function tryLaunch(){
  if(B.state!=='run')return;
  if(P.state==='hurt'||P.state==='cast')return;
  const t=nearestEnemy(180);
  P.state='strike';P.stT=.2;P._hitDone=false;P._launcher=true;
  P.target=null;P.queued=null;
  if(t){P.face=t.x>P.x?1:-1;}
  P.vy=-560;P.air=true;P.y-=2;
  sfx('launch');
}
function strikeHit(){
  const c=P.ch,mults=c.combo;
  const mult=mults[P.combo%mults.length];
  const last=(P.combo%mults.length)===mults.length-1;
  const range=c.wtype==='guandao'?128:(c.wtype==='ribbon'?118:132);
  let hitAny=false;
  for(const e of B.enemies){
    if(e.hp<=0)continue;
    const dx=e.x-P.x,dy=(e.y-30*e.scale)-(P.y-30);
    if(Math.sign(dx)===P.face||Math.abs(dx)<50){
      if(Math.abs(dx)<range&&Math.abs(dy)<90){
        hitAny=true;
        dmgEnemy(e,P.atk*mult*rnd(.92,1.08),{
          crit:last,launch:P._launcher,pierce:last,
          kx:last?320:120,hstop:last?.09:.05,shake:last?6:3});
      }
    }
  }
  // 反射箭矢
  for(const pr of B.projs){
    if(pr.dead)continue;
    if(Math.abs(pr.x-P.x)<110&&Math.abs(pr.y-(P.y-34))<60){
      pr.vx=Math.abs(pr.vx)*1.4*P.face;pr.friendly=true;
      fxRing(pr.x,pr.y);fxText(pr.x,pr.y-24,'反彈','#4A6B57',14);sfx('parry');
    }
  }
  const ang=P.face===1?rnd(-.5,.3):Math.PI+rnd(-.3,.5);
  fxSlash(P.x+P.face*66,P.y-38,ang,last?1.4:1,last?'#A5302A':'#1B1611');
  sfx('slash');
  if(hitAny){
    P.comboCount++;
    const tag=$('#combo-tag');tag.textContent=P.comboCount+' 連';
    tag.style.opacity=1;clearTimeout(tag._h);tag._h=setTimeout(()=>tag.style.opacity=0,900);
  }
  P.combo++;
}
/* ---------- 奧義（frame 驅動，避免 setTimeout 軟鎖） ---------- */
function hideCutin(){
  const ci=$('#cutin');
  ci.style.display='none';
  ci.classList.remove('play');
}
function resolveSkillHit(){
  if(!B||!P||P._skillResolved)return;
  P._skillResolved=true;
  const sk=P.ch.skill;
  sfx('skill');B.shake=14;B.hstop=Math.min(0.12,.12);
  fxRing(P.x,P.y-40,'#A5302A');
  for(let i=0;i<26;i++)B.fx.push({t:0,life:rnd(.5,1.1),type:'blob',x:P.x+rnd(-40,40),y:P.y-30,
    color:i%3?'#1B1611':'#A5302A',vx:rnd(-460,460),vy:rnd(-520,-60),r:rnd(4,14)});
  for(const e of B.enemies){
    if(e.hp<=0)continue;
    if(Math.abs(e.x-P.x)<sk.radius){
      dmgEnemy(e,P.atk*sk.mult*rnd(.95,1.05),{crit:true,noParry:true,pierce:true,launch:true,kx:380,shake:8});
    }
  }
  updHUD();
}
function finishSkill(){
  if(!B||!P)return;
  hideCutin();
  resolveSkillHit();
  if(B.state==='cutin')B.state='run';
  if(P.state==='cast'){P.state='idle';P.stT=0;}
  P.vx=0;P.queued=null;P.target=null;
}
function trySkill(){
  if(!B||B.state!=='run'||P.sp<100)return;
  if(P.state==='cast')return;
  P.sp=0;B.state='cutin';P.state='cast';P.stT=.9;P.vx=0;
  P._skillResolved=false;P.queued=null;P.target=null;
  const ci=$('#cutin');
  ci.querySelector('.cname2').textContent=P.ch.name+'・'+P.ch.title;
  ci.querySelector('.sname2').textContent=P.ch.skill.name;
  ci.style.display='flex';ci.classList.remove('play');void ci.offsetWidth;ci.classList.add('play');
  updHUD();
}
/* ---------- 更新 ---------- */
function trySwitch() {
  if (!B || B.state !== 'run' || !P) return;
  const party = B.party;
  if (!party?.sub) return;
  if (party.switchCd > 0) return;
  if (P.state === 'cast' || P.state === 'hurt') return;

  const from = P.key;
  const to = from === party.main ? party.sub : party.main;
  const next = party.members[to];
  if (!next || next.hp <= 0) {
    fxText(P.x, P.y - 90, '副將已力竭', '#A5302A', 16);
    return;
  }

  // 保存當前氣血
  party.members[from].hp = Math.max(0, P.hp);

  P.key = to;
  P.ch = next.ch;
  P.maxHp = next.maxHp;
  P.hp = next.hp;
  P.atk = next.atk;
  P.spd = next.spd;
  P.state = 'idle';
  P.stT = 0;
  P.vx = 0;
  P.vy = 0;
  P.air = false;
  P.y = GY;
  P.target = null;
  P.queued = null;
  P.sp = clamp(P.sp * 0.7, 0, 100);
  P.inv = Math.max(P.inv, 0.55);
  P.anim = Math.random() * 9;
  party.switchCd = SWITCH_CD;

  fxInk(P.x, P.y - 30, 1.4, '#A5302A');
  fxRing(P.x, P.y - 40, '#8C6B2F');
  showBanner(`切換・${next.ch.name}`);
  sfx('dash');
  $('#hp-name').textContent = `${next.ch.name}　Lv.${next.lv}`;
  updHUD();
}

function updHUD() {
  if (!P) return;
  $('#hp-fill').style.width = (P.hp / P.maxHp * 100) + '%';
  const sb = $('#skill-btn');
  sb.style.background = `conic-gradient(var(--seal) ${P.sp * 3.6}deg, rgba(165,48,42,.15) ${P.sp * 3.6}deg)`;
  sb.classList.toggle('ready', P.sp >= 100);

  const sw = $('#switch-btn');
  const label = $('#switch-label');
  const party = B?.party;
  if (party?.sub) {
    sw.classList.add('show');
    const other = P.key === party.main ? party.sub : party.main;
    const otherM = party.members[other];
    const dead = !otherM || otherM.hp <= 0;
    const cd = party.switchCd;
    sw.disabled = dead || cd > 0 || P.state === 'cast';
    sw.classList.toggle('ready', !sw.disabled);
    if (cd > 0) label.innerHTML = `<span class="cd">${Math.ceil(cd)}</span>`;
    else if (dead) label.textContent = '竭';
    else label.textContent = CHARS[other]?.name?.[0] || '換';
  } else {
    sw.classList.remove('show');
    sw.disabled = true;
  }

  if (B && B.bossOn) {
    const bo = B.enemies.find((e) => e.boss);
    if (bo) $('#boss-fill').style.width = clamp(bo.hp / bo.maxHp * 100, 0, 100) + '%';
  }
}
function updatePlayer(dt){
  P.anim+=dt;P.inv=Math.max(0,P.inv-dt);P.hurtF=Math.max(0,P.hurtF-dt);
  if(B.party)B.party.switchCd=Math.max(0,B.party.switchCd-dt);
  P.comboT-=dt;if(P.comboT<=0){P.combo=0;if(P.comboT<-2)P.comboCount=0;}
  // 重力（cast 除外仍可落地，避免浮空卡住）
  if(P.air&&P.state!=='cast'){P.vy+=1900*dt;P.y+=P.vy*dt;
    if(P.y>=GY){P.y=GY;P.air=false;P.vy=0;fxInk(P.x,GY-4,.5);}}
  switch(P.state){
    case 'idle':case 'run':{
      let mv=0;if(keys.ArrowLeft||keys.a)mv=-1;if(keys.ArrowRight||keys.d)mv=1;
      if(mv){P.vx=mv*300*P.spd;P.face=mv;P.state='run';}
      else{P.vx*=Math.exp(-12*dt);if(Math.abs(P.vx)<10){P.vx=0;P.state='idle';}}
      if(mv===0&&B.autoRun&&aliveEnemies()===0&&B.wave<B.zones.length-1){
        const tx=B.zones[B.wave+1]-120;
        if(P.x<tx){P.vx=320*P.spd;P.face=1;P.state='run';}
      }
      break;}
    case 'lunge':{
      P.stT-=dt;P._lungeAge=(P._lungeAge||0)+dt;
      const t=P.target;
      if(!t||t.hp<=0||P._lungeAge>0.4){
        P.state='strike';P.stT=.16;P._hitDone=false;P._launcher=false;P.target=null;break;
      }
      const dx=t.x-P.x;P.face=dx>0?1:-1;
      P.x+=Math.sign(dx)*1150*dt;
      // 空中只輕跟，不鎖死 vy，避免黏在空中
      if(t.air&&t.y<GY-30&&P._lungeAge<0.22){
        P.air=true;P.y+=((t.y)-P.y)*6*dt;P.vy=Math.min(P.vy,40);
      }
      if(Math.abs(dx)<70||P.stT<=0){
        P.state='strike';P.stT=.16;P._hitDone=false;P._launcher=false;
      }
      break;}
    case 'strike':{
      P.stT-=dt;
      if(!P._hitDone&&P.stT<=.11){P._hitDone=true;strikeHit();P._launcher=false;}
      if(P.stT<=0){
        if(P.queued){const q=P.queued;P.queued=null;tryAttack(q.dir);}
        else{P.state='idle';P.target=null;}
      }
      break;}
    case 'dash':{
      P.stT-=dt;P.x+=P.vx*dt;
      if(P.stT<=0){P.state='idle';P.vx=0;}
      break;}
    case 'hurt':{
      P.stT-=dt;P.x+=P.vx*dt;P.vx*=Math.exp(-6*dt);
      if(P.stT<=0){P.state='idle';P.vx=0;}
      break;}
    case 'cast':{
      P.stT-=dt;
      // 動畫中段結算傷害；結束必回可控
      if(P.stT<=.35&&!P._skillResolved)resolveSkillHit();
      if(P.stT<=0)finishSkill();
      break;}
    default:
      P.state='idle';P.stT=0;P.queued=null;P.target=null;
  }
  if(P.state==='run'||P.state==='idle')P.x+=P.vx*dt;
  P.x=clamp(P.x,40,B.st.len-40);
  if(P.air&&(P.state==='strike'||P.state==='lunge'))P.vy=Math.min(P.vy,80);
}
/** 狀態異常時強制回到可操作 */
function recoverIfStuck(dt){
  if(!B||!P||B.state==='over')return;
  P._stuckT=(P._stuckT||0);
  const locked=P.state==='cast'||P.state==='lunge'||P.state==='strike'||P.state==='dash'||P.state==='hurt'||B.state==='cutin';
  if(locked)P._stuckT+=dt;else P._stuckT=0;
  // 超過 1.4s 仍鎖住 → 強制解鎖
  if(P._stuckT>1.4){
    hideCutin();
    if(B.state==='cutin')B.state='run';
    P.state='idle';P.stT=0;P.vx=0;P.queued=null;P.target=null;
    P._stuckT=0;P._skillResolved=true;
  }
}
function aliveEnemies(){let n=0;for(const e of B.enemies)if(e.hp>0)n++;return n;}

function enemyAttack(e){
  // 出手
  if(e.bow){
    const dy=-30*e.scale;
    const dx=P.x-e.x,dyv=(P.y-30)-(e.y+dy);
    const sp=430,len=Math.hypot(dx,dyv)||1;
    B.projs.push({x:e.x+e.face*20,y:e.y+dy,vx:dx/len*sp,vy:dyv/len*sp,dead:false,friendly:false,atk:e.atk});
    sfx('slash');return;
  }
  const range=e.boss?e.range+40:e.range+18;
  fxSlash(e.x+e.face*40*e.scale,e.y-36*e.scale,e.face===1?0:Math.PI,e.scale,'#4a2020');
  sfx('slash');
  if(Math.sign(P.x-e.x)===e.face||Math.abs(P.x-e.x)<40){
    if(Math.abs(P.x-e.x)<range&&Math.abs(P.y-e.y)<80){dmgPlayer(e.atk*rnd(.9,1.1),e.x);}
  }
  if(e.brute||e.boss){B.shake=Math.max(B.shake,5);fxInk(e.x+e.face*60,GY-6,.9);}
}
function updateEnemy(e,dt){
  e.anim+=dt;e.hurtF=Math.max(0,e.hurtF-dt);
  if(e.air){e.vy+=1750*dt;e.y+=e.vy*dt;
    if(e.y>=GY){e.y=GY;e.air=false;e.vy=0;fxInk(e.x,GY-4,.5);
      if(e.state==='hurt'){e.stT=Math.max(e.stT,.2);}
      else if(e.state==='leap'){ // 躍擊落地震盪
        e.vx=0;B.shake=Math.max(B.shake,9);sfx('hit');
        fxRing(e.x,GY-10,'#A5302A');fxInk(e.x-50,GY-8,1.1);fxInk(e.x+50,GY-8,1.1);
        if(Math.abs(P.x-e.x)<150&&!P.air)dmgPlayer(e.atk*1.1,e.x);
        e.state='cool';e.stT=1.0;e.cool=rnd(.8,1.3);
      }}}
  if(e.state==='dead'){e.stT-=dt;return;}
  const dx=P.x-e.x,adx=Math.abs(dx);
  switch(e.state){
    case 'idle':{
      e.stT-=dt;e.face=dx>0?1:-1;
      if(e.stT<=0)e.state='walk';
      break;}
    case 'walk':{
      e.face=dx>0?1:-1;e.cool-=dt;
      let want=0;
      if(e.keep){ // 弓兵保持距離
        if(adx<e.keep-60)want=-e.face;else if(adx>e.keep+80)want=e.face;
      }else{
        if(adx>e.range-24)want=e.face;
      }
      e.x+=want*e.spd*dt;
      const inRange=e.keep?adx<e.range&&adx>120:adx<e.range;
      if(inRange&&e.cool<=0){e.state='tele';e.stT=e.tele*(e.rage?.7:1);}
      break;}
    case 'tele':{
      e.stT-=dt;
      if(e.stT<=0){
        e.state='atk';e.stT=.18;e._did=false;
      }
      break;}
    case 'atk':{
      e.stT-=dt;
      if(!e._did&&e.stT<=.1){e._did=true;enemyAttack(e);}
      if(e.stT<=0){e.state='cool';e.stT=e.boss?rnd(.5,.9):rnd(.9,1.5);e.cool=e.boss?rnd(.6,1.1):rnd(1.2,2.2);}
      break;}
    case 'cool':{
      e.stT-=dt;
      // 首領移位
      if(e.boss&&e.pat>=3&&e.stT<.3&&adx<420&&Math.random()<.45&&!e.air){
        e.state='leap';e.face=dx>0?1:-1;e.air=true;e.y-=2;
        e.vy=-680;e.vx=clamp(dx,-380,380)/.78;
        fxText(e.x,e.y-90*e.scale,'躍擊！','#A5302A',15);sfx('launch');
      }
      else if(e.boss&&e.pat>=2&&e.stT<.3&&adx>320&&Math.random()<.5){
        e.state='rush';e.stT=.55;e.face=dx>0?1:-1;fxText(e.x,e.y-90*e.scale,'突進！','#A5302A',15);
      }
      if(e.stT<=0&&e.state==='cool')e.state='walk';
      break;}
    case 'leap':{
      e.x+=e.vx*dt;
      break;}
    case 'rush':{
      e.stT-=dt;e.x+=e.face*640*dt;
      if(Math.abs(P.x-e.x)<70&&!e._rushHit){e._rushHit=true;dmgPlayer(e.atk*.8,e.x);}
      B.fx.push({t:0,life:.25,type:'streak',x:e.x-e.face*10,y:e.y-34*e.scale,dir:e.face});
      if(e.stT<=0){e.state='cool';e.stT=.8;e._rushHit=false;}
      break;}
    case 'hurt':{
      e.stT-=dt;e.x+=e.vx*dt;e.vx*=Math.exp(-6*dt);
      if(e.stT<=0&&!e.air)e.state='walk';
      break;}
    case 'stun':{
      e.stT-=dt;
      if(e.stT<=0){e.state='walk';e.stun=0;}
      break;}
  }
  // 呂布狂化
  if(e.boss&&!e.rage&&e.hp<e.maxHp*.5){
    e.rage=true;e.spd*=1.35;e.atk*=1.2;
    fxText(e.x,e.y-110*e.scale,e.lubu?'吾乃呂布！':'狂化！','#A5302A',22);
    fxRing(e.x,e.y-40*e.scale);sfx('hurt');
  }
  e.x=clamp(e.x,40,B.st.len-40);
}
function updateProjs(dt){
  for(const p of B.projs){
    if(p.dead)continue;
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.x<-50||p.x>B.st.len+50||p.y>VH+50){p.dead=true;continue;}
    if(p.friendly){
      for(const e of B.enemies){
        if(e.hp<=0)continue;
        if(Math.abs(p.x-e.x)<34&&Math.abs(p.y-(e.y-30*e.scale))<50){
          dmgEnemy(e,p.atk*2.2,{crit:true,noParry:true});p.dead=true;break;}
      }
    }else{
      if(P.inv<=0&&Math.abs(p.x-P.x)<26&&Math.abs(p.y-(P.y-34))<44){
        dmgPlayer(p.atk,p.x);p.dead=true;}
    }
  }
  B.projs=B.projs.filter(p=>!p.dead);
}
function updateFx(dt){
  for(const f of B.fx){f.t+=dt;
    if(f.type==='blob'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=900*dt;}
  }
  B.fx=B.fx.filter(f=>f.t<f.life);
  for(const t of B.texts){t.t+=dt;t.y-=34*dt;}
  B.texts=B.texts.filter(t=>t.t<t.life);
}
/* ---------- 主迴圈 ---------- */
function loop(now){
  if(!B)return;
  rafId=requestAnimationFrame(loop);
  let dt=Math.min((now-lastT)/1000,.034);lastT=now;
  if(B.state==='pause')return;
  // 時緩恢復
  if(B.tsT>0){B.tsT-=dt;if(B.tsT<=0)B.ts=1;}
  let sdt=dt*B.ts;
  // 打擊停頓（上限，避免幾乎停格）
  if(B.hstop>0){B.hstop=Math.min(B.hstop,.12);B.hstop-=dt;sdt*=.18;}
  B.time+=sdt;B.bannerT-=dt;
  // cutin 期間仍推進玩家 cast 計時，避免只靠 timeout
  if(B.state==='run'||B.state==='cutin'){
    updatePlayer(sdt);
    recoverIfStuck(dt);
    if(B.state==='run'){
      for(const e of B.enemies)updateEnemy(e,sdt);
      updateProjs(sdt);
      B.enemies=B.enemies.filter(e=>!(e.state==='dead'&&e.stT<=0));
      if(aliveEnemies()===0){
        if(B.wave>=B.st.waves.length){endBattle(true);}
        else{
          const nz=B.zones[B.wave+1];
          if(B.wave<0||P.x>nz-260)spawnWave();
        }
      }
      updHUD();
    }
  }
  updateFx(sdt+dt*.3);
  // 相機
  const tx=clamp(P.x-VW*.42,0,B.st.len-VW);
  B.cam+=(tx-B.cam)*(1-Math.exp(-7*dt));
  B.shake*=Math.exp(-8*dt);
  render();
}

/* ---------- 繪製 ---------- */
let bgCache=null,bgIdx=-1;
function getBg(){
  if(bgIdx===B.idx&&bgCache)return bgCache;
  bgIdx=B.idx;
  const c=document.createElement('canvas');c.width=VW;c.height=VH;
  const g=c.getContext('2d');
  drawMountains(g,VW,VH,31+B.idx*17,B.st.tint);
  bgCache=c;return c;
}
function render(){
  ctx.clearRect(0,0,VW,VH);
  const shx=rnd(-B.shake,B.shake),shy=rnd(-B.shake,B.shake)*.6;
  // 遠山（緩速視差）
  ctx.save();ctx.translate(-B.cam*.15%VW+shx*.3,shy*.3);
  const bg=getBg();ctx.drawImage(bg,0,0);ctx.drawImage(bg,VW,0);ctx.restore();
  ctx.save();ctx.translate(-B.cam+shx,shy);
  // 中景旌旗
  const R=mulberry(97+B.idx);
  for(let fx=200;fx<B.st.len;fx+=420){
    const sway=Math.sin(B.time*1.4+fx)*.05;
    ctx.save();ctx.translate(fx+R()*160,GY);ctx.rotate(sway);
    ctx.globalAlpha=.5;
    inkStroke(ctx,[[0,0],[0,-150]],3,1);
    ctx.fillStyle=B.st.tint;
    ctx.beginPath();ctx.moveTo(0,-150);ctx.lineTo(64,-136);ctx.lineTo(0,-114);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  // 地面墨線
  ctx.save();
  ctx.strokeStyle='#1B1611';ctx.lineWidth=5;ctx.globalAlpha=.85;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-40,GY+4);
  for(let x=-40;x<B.st.len+40;x+=60)ctx.lineTo(x,GY+4+Math.sin(x*.02)*2);
  ctx.stroke();
  ctx.globalAlpha=.12;ctx.fillStyle='#1B1611';ctx.fillRect(-40,GY+6,B.st.len+80,VH-GY);
  // 草叢筆觸
  const R2=mulberry(5+B.idx);
  for(let x=0;x<B.st.len;x+=90){
    const gx=x+R2()*70;ctx.globalAlpha=.35;
    inkStroke(ctx,[[gx,GY+2],[gx-4+R2()*8,GY-10-R2()*8]],1.6,1);
  }
  ctx.restore();
  // 章末區域紅印
  const bz=B.zones[B.zones.length-1];
  ctx.save();ctx.translate(bz+220,GY-190);ctx.rotate(.04);ctx.globalAlpha=.85;
  ctx.fillStyle='#A5302A';ctx.fillRect(-26,-26,52,52);
  ctx.fillStyle='#EAE2CE';ctx.font='20px "Noto Serif TC",serif';ctx.textAlign='center';
  ctx.fillText('決',0,-3);ctx.fillText('戰',0,18);ctx.restore();
  // 箭矢
  for(const p of B.projs){
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));
    ctx.strokeStyle=p.friendly?'#4A6B57':'#1B1611';ctx.lineWidth=2.6;
    ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(10,0);ctx.stroke();
    ctx.fillStyle=ctx.strokeStyle;
    ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(7,-4);ctx.lineTo(7,4);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  // 敵人
  for(const e of B.enemies){
    if(e.state==='dead'){
      ctx.save();ctx.globalAlpha=clamp(e.stT/.5,0,1);
      drawChibi(ctx,e.x,e.y,e.face,'hurt',e.ch,{t:e.anim,scale:e.scale,turban:e.turban,bow:e.bow,brute:e.brute});
      ctx.restore();continue;
    }
    let pose='idle';
    if(e.state==='walk')pose='run';else if(e.state==='tele')pose='tele';
    else if(e.state==='atk')pose='strike';else if(e.state==='hurt')pose='hurt';
    else if(e.state==='stun')pose='stun';else if(e.state==='rush'||e.state==='leap')pose='lunge';
    drawChibi(ctx,e.x,e.y,e.face,pose,e.ch,{t:e.anim,st:e.stT,scale:e.scale,
      turban:e.turban,bow:e.bow,brute:e.brute,rage:e.rage,flash:e.hurtF>0});
    // 小血條
    if(!e.boss&&e.hp<e.maxHp){
      const bw=44*e.scale;
      ctx.fillStyle='rgba(27,22,17,.25)';ctx.fillRect(e.x-bw/2,e.y-78*e.scale,bw,4);
      ctx.fillStyle='#A5302A';ctx.fillRect(e.x-bw/2,e.y-78*e.scale,bw*clamp(e.hp/e.maxHp,0,1),4);
    }
    if(e.stun>0){
      ctx.save();ctx.translate(e.x,e.y-86*e.scale);ctx.rotate(B.time*4);
      ctx.font='15px serif';ctx.fillStyle='#8C6B2F';ctx.textAlign='center';ctx.fillText('❋',0,0);ctx.restore();
    }
  }
  // 玩家
  {
    let pose=P.state;
    if(pose==='run'&&Math.abs(P.vx)<10)pose='idle';
    if(P.air&&(pose==='idle'||pose==='run'))pose='air';
    ctx.save();
    if(P.inv>0&&P.state!=='dash'&&Math.floor(B.time*20)%2)ctx.globalAlpha=.45;
    drawChibi(ctx,P.x,P.y,P.face,pose,P.ch,{t:P.anim,st:P.stT,combo:P.combo,flash:P.hurtF>0});
    ctx.restore();
  }
  // 特效
  for(const f of B.fx){
    const k=1-f.t/f.life;
    if(f.type==='blob')inkBlob(ctx,f.x,f.y,f.r*k+1,.65*k,f.color);
    else if(f.type==='slash'){
      ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.ang);
      ctx.strokeStyle=f.color;ctx.lineCap='round';ctx.globalAlpha=k;
      for(let i=0;i<3;i++){
        ctx.lineWidth=(9-i*3)*f.s;
        ctx.beginPath();ctx.arc(0,0,(46+i*9)*f.s,-1.1,.9);ctx.stroke();
      }
      ctx.restore();
    }else if(f.type==='ring'){
      ctx.save();ctx.strokeStyle=f.color;ctx.globalAlpha=k;ctx.lineWidth=4*k+1;
      ctx.beginPath();ctx.arc(f.x,f.y,(1-k)*90+12,0,TAU);ctx.stroke();ctx.restore();
    }else if(f.type==='streak'){
      ctx.save();ctx.globalAlpha=.3*k;ctx.strokeStyle='#1B1611';ctx.lineWidth=8*k;
      ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x-f.dir*46,f.y);ctx.stroke();ctx.restore();
    }
  }
  // 浮動文字
  ctx.textAlign='center';
  for(const t of B.texts){
    const k=1-t.t/t.life;
    ctx.save();ctx.globalAlpha=Math.min(1,k*2);
    ctx.font=`700 ${t.size}px "Noto Serif TC",serif`;
    ctx.fillStyle=t.color;ctx.fillText(t.str,t.x,t.y);ctx.restore();
  }
  ctx.restore();
  // 前進指示
  if(B.state==='run'&&aliveEnemies()===0&&B.wave<B.zones.length-1&&B.wave>=0){
    const a=.55+Math.sin(B.time*5)*.35;
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#A5302A';
    ctx.font='700 22px "Noto Serif TC",serif';ctx.textAlign='center';
    ctx.fillText('前 進 ▶▶',VW*.78,VH*.42);ctx.restore();
  }
  // 陣次橫幅
  if(B.bannerT>0){
    const a=Math.min(1,B.bannerT/.4);
    ctx.save();ctx.globalAlpha=a;
    ctx.fillStyle='rgba(27,22,17,.85)';
    ctx.fillRect(VW/2-190,74,380,52);
    ctx.fillStyle='#EAE2CE';ctx.font='24px "Noto Serif TC",serif';ctx.textAlign='center';
    ctx.fillText(B.banner,VW/2,109);
    ctx.fillStyle='#A5302A';ctx.fillRect(VW/2-190,74,6,52);ctx.fillRect(VW/2+184,74,6,52);
    ctx.restore();
  }
}

/* ---------- 勝敗 ---------- */
function endBattle(win){
  if(B.over)return;B.over=true;B.state='over';
  sfx(win?'win':'lose');
  setTimeout(()=>{
    const st=B.st,idx=B.idx;
    $('#res-title').textContent=win?'克 捷':'敗 陣';
    $('#res-title').className='ov-title '+(win?'win':'lose');
    let lines='';
    if(win){
      const ratio=P.hp/P.maxHp;
      const stars=ratio>.7?3:ratio>.35?2:1;
      const first=save.stars[idx]===0;
      const reward=st.gold+(first?st.gold:0);
      save.stars[idx]=Math.max(save.stars[idx],stars);
      save.gold+=reward;
      $('#res-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
      lines=`討平 ${st.name}　殘存氣血 ${Math.round(ratio*100)}%<br>戰利 <b>金 ${reward}</b>${first?'（含首捷雙倍）':''}`;
      // 解鎖
      Object.keys(CHARS).forEach(k=>{
        const c=CHARS[k];
        if(!save.chars[k].un&&c.unlock&&idx+1>=c.unlock){
          save.chars[k].un=1;
          lines+=`<br><b style="color:var(--seal)">新武將解鎖 —— ${c.name}【${c.title}】</b>`;
        }
      });
      if(idx+1<STAGES.length&&save.stars[idx]>0)lines+=`<br>已開啟 ${STAGES[idx+1].chap}・${STAGES[idx+1].name}`;
      persist();
    }else{
      $('#res-stars').textContent='';
      lines='勝敗乃兵家常事。<br>不妨回卷「修行」提昇修為，或改易武將再戰。';
      persist();
    }
    $('#res-lines').innerHTML=lines;
    $('#ov-result').classList.add('show');
  },win?600:900);
}
$('#btn-retry').onclick=()=>{const i=B.idx;stopBattle();startBattle(i);};
$('#btn-return').onclick=()=>{stopBattle();onReturnMenu();};
$('#pause-btn').onclick=()=>{
  if(!B||B.state==='over'||B.state==='cutin')return;
  B.state='pause';$('#ov-pause').classList.add('show');
};
$('#btn-resume').onclick=()=>{
  $('#ov-pause').classList.remove('show');
  if(!B)return;
  hideCutin();
  if(P&&P.state==='cast')finishSkill();
  B.state='run';
  lastT=performance.now();
};
$('#btn-quit').onclick=()=>{stopBattle();onReturnMenu();};
export function stopBattle(){
  cancelAnimationFrame(rafId);B=null;
  hideCutin();
  $('#ov-result').classList.remove('show');$('#ov-pause').classList.remove('show');
}
$('#skill-btn').onclick=e=>{e.stopPropagation();trySkill();};
$('#switch-btn').onclick=e=>{e.stopPropagation();trySwitch();};

/* ---------- 輸入 ---------- */
const keys={};
addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(!B||B.state!=='run')return;
  if(e.key==='j'||e.key==='J'||e.key==='z')tryAttack(P.face);
  if(e.key==='k'||e.key==='K'||e.key==='x')trySkill();
  if(e.key==='l'||e.key==='L')trySwitch();
  if(e.key==='ArrowUp'||e.key==='w')tryLaunch();
  if(e.key==='Shift')tryDash(P.face);
});
addEventListener('keyup',e=>keys[e.key]=false);

let ptr=null;
cv.addEventListener('pointerdown',e=>{
  initAudio();
  ptr={sx:e.clientX,sy:e.clientY,st:performance.now()};
});
addEventListener('pointerup',e=>{
  if(!ptr||!B||B.state!=='run'){ptr=null;return;}
  const dx=e.clientX-ptr.sx,dy=e.clientY-ptr.sy,dt=performance.now()-ptr.st;
  const dist=Math.hypot(dx,dy);
  if(dist<24&&dt<320){
    // 輕點：往點擊方向攻擊
    const rect=cv.getBoundingClientRect();
    const wx=(ptr.sx-rect.left)/cv._scale+B.cam;
    tryAttack(wx>P.x?1:-1);
  }else if(dist>=34){
    if(Math.abs(dy)>Math.abs(dx)){
      if(dy<0)tryLaunch();
    }else tryDash(dx>0?1:-1);
  }
  ptr=null;
});


