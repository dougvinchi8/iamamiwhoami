/* Mandragora RPG — script.js
   Fan project inspired by ionnalee / iamamiwhoami.
   Self-contained: no external libs needed.
*/

/* ---------------------------
   Config & DOM
   --------------------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', {alpha:false});
let W = canvas.width, H = canvas.height;

const modeSel = document.getElementById('mode');
const btnRestart = document.getElementById('btnRestart');
const btnReset = document.getElementById('btnReset');
const hudMand = document.getElementById('hud-mand');
const hudAnimal = document.getElementById('hud-animal');
const hudChap = document.getElementById('hud-chap');
const message = document.getElementById('message');
const promptEl = document.getElementById('prompt');

let mode = modeSel.value;

/* controls */
const keys = {};
window.addEventListener('keydown', e=> keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e=> keys[e.key.toLowerCase()] = false);

/* quick util */
const rand = (a,b) => Math.floor(Math.random()*(b-a+1)) + a;
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

/* embedded SVG sprites (data URI) */
const playerSVG = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' width='80' height='80'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#f4f9ff'/><stop offset='1' stop-color='#dbe9ff'/></linearGradient></defs><circle cx='40' cy='28' r='16' fill='url(#g)'/><ellipse cx='40' cy='52' rx='22' ry='14' fill='#f6fbff'/></svg>`);
const animalSVG = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40' width='60' height='40'><rect width='60' height='40' rx='8' fill='#fff'/><circle cx='18' cy='20' r='10' fill='#e8f3ff'/></svg>`);
const mandSVG = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40'><rect x='6' y='12' width='28' height='18' rx='6' fill='#e8ffe9'/><path d='M8 14 q8 -12 24 0' fill='#d1ffd8'/></svg>`);

/* ---------------------------
   World state
   --------------------------- */
let world = {
  width: 1800,
  height: 1200,
  obstacles: [],
  mandragoras: [],
  animals: [],
  player: null,
  camera: {x:0,y:0,w:W,h:H},
  chapter: 0
};

/* ---------------------------
   Initialization
   --------------------------- */
function init(reset=false){
  // responsive canvas sizing
  W = Math.max(900, Math.min(window.innerWidth-80, 1400));
  H = Math.max(600, Math.min(window.innerHeight-160, 900));
  canvas.width = W; canvas.height = H;
  world.camera.w = W; world.camera.h = H;

  // player
  world.player = { x:120, y:120, w:32, h:40, speed:170, mandragoras:0, animals:0 };

  // mode specific world size
  if(modeSel.value === 'largemap') world.width = 3200, world.height = 2200;
  else world.width = 1800, world.height = 1200;

  world.obstacles = [];
  // place obstacles (trees, rocks)
  for(let i=0;i<60;i++){
    const w = rand(48, 160), h = rand(48, 160);
    const x = rand(20, world.width - w - 20), y=rand(20, world.height - h - 20);
    world.obstacles.push({x,y,w,h, type: i%4===0 ? 'rock' : 'tree'});
  }

  // mandragoras
  const mandCount = modeSel.value==='basic' ? 3 : (modeSel.value==='largemap'?10:6);
  world.mandragoras = [];
  for(let i=0;i<mandCount;i++) placeEntity(world.mandragoras, {w:20,h:28});

  // animals (moving)
  const animalCount = modeSel.value==='basic' ? 1 : (modeSel.value==='largemap'?6:3);
  world.animals = [];
  for(let i=0;i<animalCount;i++) placeEntity(world.animals, {w:28,h:20}, true);

  world.chapter = 0;
  updateHUD();
  showMessage('Mode: ' + modeSel.value.toUpperCase(), 1600);
}

/* place entity with naive collision avoidance */
function placeEntity(arr, size, moving=false){
  let tries = 0;
  while(tries < 400){
    tries++;
    const x = rand(40, world.width - size.w - 40);
    const y = rand(40, world.height - size.h - 40);
    const rect = {x,y,w:size.w,h:size.h};
    if(!collidesAny(rect, [world.player, ...world.obstacles, ...arr])) {
      if(moving){ rect.vx = rand(30,80) * (rand(0,1)?1:-1); rect.vy = rand(30,80) * (rand(0,1)?1:-1); }
      arr.push(rect); return;
    }
  }
  arr.push({x:50 + arr.length*40, y:80 + arr.length*20, w:size.w, h:size.h, vx:0, vy:0});
}

/* collision check */
function rectIntersects(a,b){ return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h) }
function collidesAny(r, arr){ if(!arr) return false; for(const o of arr) if(o && rectIntersects(r,o)) return true; return false }

/* ---------------------------
   Game loop
   --------------------------- */
let last = 0;
function loop(ts){
  if(!last) last = ts;
  const dt = Math.min(0.035, (ts-last)/1000);
  update(dt);
  render();
  last = ts;
  requestAnimationFrame(loop);
}

/* ---------------------------
   Update
   --------------------------- */
function update(dt){
  const p = world.player;
  let vx = 0, vy = 0;
  if(keys['arrowleft'] || keys['a']) vx = -1;
  if(keys['arrowright'] || keys['d']) vx = 1;
  if(keys['arrowup'] || keys['w']) vy = -1;
  if(keys['arrowdown'] || keys['s']) vy = 1;
  if(vx && vy){ vx*=0.7071; vy*=0.7071; }
  p.vx = vx * p.speed; p.vy = vy * p.speed;

  // move with simple collision resolution
  moveWithCollisions(p, p.vx*dt, p.vy*dt);

  // animals wander & bounce
  for(const a of world.animals){
    if(a.vx || a.vy){
      let nx = a.x + a.vx*dt, ny = a.y + a.vy*dt;
      const future = {x:nx,y:ny,w:a.w,h:a.h};
      if(nx < 10 || ny < 10 || nx + a.w > world.width - 10 || ny + a.h > world.height - 10) { a.vx *= -1; a.vy *= -1; }
      if(collidesAny(future, world.obstacles)){ a.vx *= -1; a.vy *= -1; }
      a.x += a.vx*dt; a.y += a.vy*dt;
    }
  }

  // interactions
  let near = null;
  for(const m of world.mandragoras) if(rectIntersects(p,m)) { near = {type:'mandragora', item:m}; break; }
  if(!near){
    for(const a of world.animals) if(rectIntersects(p,a)) { near = {type:'animal', item:a}; break; }
  }

  if(near) promptEl.classList.remove('hidden'); else promptEl.classList.add('hidden');

  if(keys['e'] && near && !keys._eLock){
    keys._eLock = true; setTimeout(()=> keys._eLock = false, 220);
    if(near.type === 'mandragora'){
      const idx = world.mandragoras.indexOf(near.item); if(idx >= 0) world.mandragoras.splice(idx,1), p.mandragoras++;
      showMessage('Mandragora harvested');
    } else {
      const idx = world.animals.indexOf(near.item); if(idx >= 0) world.animals.splice(idx,1), p.animals++;
      showMessage('Creature captured');
    }
    updateHUD();
    checkProgress();
  }

  // camera follow
  world.camera.x = clamp(p.x - world.camera.w/2, 0, world.width - world.camera.w);
  world.camera.y = clamp(p.y - world.camera.h/2, 0, world.height - world.camera.h);
}

/* movement with collisions (axis separated for sliding) */
function moveWithCollisions(obj, dx, dy){
  if(dx !== 0){
    obj.x += dx;
    if(collidesAny(obj, world.obstacles)){ obj.x -= dx; }
    obj.x = clamp(obj.x, 6, world.width - obj.w - 6);
  }
  if(dy !== 0){
    obj.y += dy;
    if(collidesAny(obj, world.obstacles)){ obj.y -= dy; }
    obj.y = clamp(obj.y, 6, world.height - obj.h - 6);
  }
}

/* progression check */
function checkProgress(){
  const p = world.player;
  if(p.mandragoras >= 3 && p.animals >= 1 && world.chapter === 0){
    world.chapter = 1; hudChap.innerText = 'Chapter: 1';
    showMessage('Chapter Unlocked: Mandragora Forest Ritual', 2600);
    // reward: spawn new mandragoras near center
    for(let i=0;i<4;i++) placeEntity(world.mandragoras, {w:20,h:28});
    updateHUD();
  }
}

/* update HUD */
function updateHUD(){
  hudMand.innerText = 'Mandragoras: ' + world.player.mandragoras;
  hudAnimal.innerText = 'Animals: ' + world.player.animals;
  hudChap.innerText = 'Chapter: ' + world.chapter;
}

/* ---------------------------
   Render
   --------------------------- */
function render(){
  // clear
  ctx.clearRect(0,0,W,H);
  // background gradient (aesthetic mode uses lighter sky)
  if(modeSel.value === 'aesthetic'){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#eff8ff'); g.addColorStop(0.25,'#dfefff'); g.addColorStop(1,'#071025');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  } else {
    ctx.fillStyle = '#061018'; ctx.fillRect(0,0,W,H);
  }

  ctx.save();
  ctx.translate(-world.camera.x, -world.camera.y);

  // ground: subtle patches
  drawGround();

  // obstacles
  for(const o of world.obstacles) drawObstacle(o);

  // mandragoras
  for(const m of world.mandragoras) drawMandragora(m);

  // animals
  for(const a of world.animals) drawAnimal(a);

  // player
  drawPlayer(world.player);

  if(modeSel.value === 'aesthetic') drawAestheticOverlays();

  ctx.restore();
}

/* Draw helpers */
function drawGround(){
  ctx.fillStyle = '#071018'; ctx.fillRect(0,0, world.width, world.height);
  // moss patches
  for(let i=0;i<8;i++){
    const x = 120 + (i*210)%world.width, y = 90 + (i*230)%world.height;
    ctx.beginPath(); ctx.ellipse(x,y,160,80,0,0,Math.PI*2);
    ctx.fillStyle = 'rgba(20,60,30,0.04)'; ctx.fill();
  }
}
function drawObstacle(o){
  if(o.type === 'tree'){
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(o.x+6, o.y+6, o.w-12, o.h-12);
  } else {
    ctx.beginPath(); ctx.ellipse(o.x + o.w/2, o.y + o.h/2, o.w/2, o.h/2, 0, 0, Math.PI*2);
    ctx.fillStyle = '#0b1016'; ctx.fill();
  }
}
function drawMandragora(m){
  if(modeSel.value === 'sprites'){
    const img = new Image(); img.src = 'data:image/svg+xml;utf8,' + mandSVG; ctx.drawImage(img, m.x-2, m.y-2, 36, 36); return;
  }
  const cx = m.x + m.w/2, cy = m.y + m.h/2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 10, 12, 0, 0, Math.PI*2);
  ctx.fillStyle = (modeSel.value === 'aesthetic') ? '#e7fff0' : '#bfe7b8'; ctx.fill();
  ctx.strokeStyle = (modeSel.value === 'aesthetic') ? '#cfead6' : '#9ecba3'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(cx, cy+10); ctx.lineTo(cx-3, cy+18); ctx.moveTo(cx, cy+10); ctx.lineTo(cx+4, cy+20); ctx.stroke();
}
function drawAnimal(a){
  if(modeSel.value === 'sprites'){
    const img = new Image(); img.src = 'data:image/svg+xml;utf8,' + animalSVG; ctx.drawImage(img, a.x-6, a.y-4, 48, 32); return;
  }
  ctx.fillStyle = (modeSel.value === 'aesthetic') ? '#fff7ea' : '#fff';
  ctx.fillRect(a.x, a.y, a.w, a.h);
  ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(a.x+2, a.y+2, a.w-4, a.h-4);
}
function drawPlayer(p){
  if(modeSel.value === 'sprites'){
    const img = new Image(); img.src = 'data:image/svg+xml;utf8,' + playerSVG; ctx.drawImage(img, p.x - 8, p.y - 16, 64, 64);
    // soft shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(p.x + 20, p.y + 48, 16,6,0,0,Math.PI*2); ctx.fill();
    return;
  }
  ctx.fillStyle = (modeSel.value === 'aesthetic') ? '#f9fdff' : '#fff'; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(p.x+4, p.y+6, p.w-8, p.h-10);
}
function drawAestheticOverlays(){
  // fog radial around player
  const p = world.player;
  const g = ctx.createRadialGradient(p.x + 120, p.y + 60, 40, p.x + 120, p.y + 60, 800);
  g.addColorStop(0, 'rgba(255,255,255,0.02)'); g.addColorStop(1, 'rgba(3,8,12,0.94)');
  ctx.fillStyle = g; ctx.fillRect(world.camera.x, world.camera.y, world.camera.w, world.camera.h);
  // floating orbs
  for(let i=0;i<12;i++){
    const ox = (i*137)%world.width, oy = (i*97)%world.height;
    ctx.beginPath(); ctx.arc(ox, oy, 6,0,Math.PI*2);
    ctx.fillStyle = 'rgba(127,183,247,0.03)'; ctx.fill();
  }
}

/* ---------------------------
   UI helpers & events
   --------------------------- */
function showMessage(txt, t=2000){
  message.textContent = txt; message.classList.remove('hidden');
  setTimeout(()=> message.classList.add('hidden'), t);
}
modeSel.addEventListener('change', ()=> init());
btnRestart.addEventListener('click', ()=> init());
btnReset.addEventListener('click', ()=> { init(true); showMessage('World reset'); });

/* start */
init();
requestAnimationFrame(loop);

/* resize */
window.addEventListener('resize', ()=> init());
