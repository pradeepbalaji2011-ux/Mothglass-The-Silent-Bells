export const WORLD_WIDTH = 7100;
export const FLOOR = 104;
export const STEP = 1 / 120;
export const SAVE_KEY = 'mothglass-thread-of-hope-v1';

export const REGIONS = [
  { name: 'Dewglass Atrium', subtitle: 'Where the lumen begins', from: 0, to: 1850, color: '#b29ab8', description: 'Beneath the roots of an unfamiliar kingdom, a small hope stirs.', art: 'grotto' },
  { name: 'Prism Orchard', subtitle: 'A song among the branches', from: 1850, to: 3700, color: '#c0a0aa', description: 'Pale branches remember a song the kingdom has forgotten.', art: 'coral' },
  { name: 'The Apricot Gallery', subtitle: 'Echoes of the old kingdom', from: 3700, to: 5480, color: '#d5c49d', description: 'Follow the old bell road. Let the sleeping towers hear you.', art: 'peak' },
  { name: 'The High Lantern', subtitle: 'A thread of hope', from: 5480, to: WORLD_WIDTH, color: '#ddd5bd', description: 'At the edge of the world, one final guardian keeps the silence.', art: 'peak' },
];

export const PLATFORMS = [
  { x: -200, y: FLOOR, w: 1160, ground: true },
  { x: 1100, y: FLOOR, w: 930, ground: true },
  { x: 2160, y: FLOOR, w: 740, ground: true },
  { x: 3050, y: FLOOR, w: 850, ground: true },
  { x: 4030, y: FLOOR, w: 730, ground: true },
  { x: 4900, y: FLOOR, w: 2400, ground: true },
  { x: 862, y: 236, w: 168 },
  { x: 1128, y: 328, w: 174 },
  { x: 1425, y: 242, w: 176 },
  { x: 1970, y: 238, w: 195 },
  { x: 2400, y: 263, w: 194 },
  { x: 2690, y: 382, w: 150 },
  { x: 2870, y: 229, w: 185 },
  { x: 3610, y: 242, w: 175 },
  { x: 3860, y: 316, w: 195 },
  { x: 4220, y: 258, w: 190 },
  { x: 4710, y: 236, w: 204 },
  { x: 5050, y: 350, w: 178 },
  { x: 5740, y: 244, w: 190 },
  { x: 6500, y: 244, w: 190 },
];

export const SHRINES = [
  { id: 0, x: 1715, y: FLOOR, name: 'The Root Bell', region: 0 },
  { id: 1, x: 3430, y: FLOOR, name: 'The Petal Bell', region: 1 },
  { id: 2, x: 5260, y: FLOOR, name: 'The Pilgrim Bell', region: 2 },
];
export const BENCHES = [{ x: 432, y: FLOOR }, { x: 2265, y: FLOOR }, { x: 4430, y: FLOOR }, { x: 5570, y: FLOOR }];
export const TOOLS = [
  { id: 'prism', name: 'Honed Prism', description: 'A sharper edge. Prism strikes deal twice the damage.', cost: 45, icon: 'prism' },
  { id: 'heart', name: 'Mossheart', description: 'Carry a little of the grotto with you. Gain one extra mask.', cost: 35, icon: 'heart' },
  { id: 'spool', name: 'Lumen Spool', description: 'Lumen slowly replenishes while you explore.', cost: 30, icon: 'spool' },
];

const ENEMY_STARTS = [
  { x: 1250, kind: 'moss', min: 1130, max: 1395 },
  { x: 1570, kind: 'moss', min: 1460, max: 1650 },
  { x: 2460, kind: 'fly', min: 2360, max: 2700, y: 204 },
  { x: 2740, kind: 'moss', min: 2600, max: 2860 },
  { x: 3250, kind: 'knight', min: 3100, max: 3330 },
  { x: 3660, kind: 'fly', min: 3500, max: 3800, y: 220 },
  { x: 4150, kind: 'knight', min: 4080, max: 4290 },
  { x: 4650, kind: 'moss', min: 4540, max: 4720 },
  { x: 5080, kind: 'fly', min: 4980, max: 5170, y: 225 },
];

function makeCollectibles() {
  const list = [];
  [[750, FLOOR + 35], [913, 277], [1200, 369], [1490, 283], [1890, 145], [2050, 279], [2460, 304], [2750, 423], [2940, 270], [3170, 145], [3670, 283], [3940, 357], [4290, 299], [4800, 277], [5110, 391], [5510, 145]].forEach(([x, y], i) => {
    for (let n = 0; n < 3; n++) list.push({ id: i * 3 + n, x: x + (n - 1) * 25, y: y + (n === 1 ? 9 : 0), taken: false });
  });
  return list;
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const validInt = (v, fallback, max = 999999) => Number.isInteger(v) && v >= 0 && v <= max ? v : fallback;

export function cleanSave(raw) {
  if (!raw || raw.version !== 1) return null;
  const bells = [0, 1, 2].map(i => raw.bells?.[i] === true);
  const checkpoint = raw.checkpoint && Number.isFinite(raw.checkpoint.x) && raw.checkpoint.x >= 0 && raw.checkpoint.x <= WORLD_WIDTH
    ? { x: raw.checkpoint.x, y: FLOOR } : { x: 635, y: FLOOR };
  return {
    version: 1, bells, checkpoint,
    shells: validInt(raw.shells, 0),
    tools: TOOLS.filter(t => Array.isArray(raw.tools) && raw.tools.includes(t.id)).map(t => t.id),
    kills: Array.isArray(raw.kills) ? raw.kills.filter(i => validInt(i, -1, 8) >= 0) : [],
    taken: Array.isArray(raw.taken) ? raw.taken.filter(i => validInt(i, -1, 47) >= 0) : [],
    deaths: validInt(raw.deaths, 0),
    time: Number.isFinite(raw.time) && raw.time >= 0 ? raw.time : 0,
    won: raw.won === true || raw.completed === true,
    completed: raw.completed === true && bells.every(Boolean),
    bossDefeated: raw.bossDefeated === true || (raw.completed === true && bells.every(Boolean)),
    steel: raw.steel === true,
  };
}

export class World {
  constructor(saved = null, onEvent = () => {}) {
    const s = cleanSave(saved);
    this.onEvent = onEvent;
    this.time = s?.time ?? 0;
    this.status = s?.completed ? 'won' : 'playing';
    this.bells = s?.bells ?? [false, false, false];
    this.shells = s?.shells ?? 0;
    this.tools = new Set(s?.tools ?? []);
    this.kills = new Set(s?.kills ?? []);
    this.deaths = s?.deaths ?? 0;
    this.hasWon = s?.won ?? false;
    this.steel = s?.steel ?? false;
    this.checkpoint = s?.checkpoint ?? { x: 635, y: FLOOR };
    this.player = {
      x: this.checkpoint.x, y: this.checkpoint.y, vx: 0, vy: 0,
      w: 24, h: 66, facing: 1, grounded: true, jumps: 0,
      health: this.tools.has('heart') ? 6 : 5, maxHealth: this.tools.has('heart') ? 6 : 5,
      lumen: s ? 100 : 75, invulnerable: 1.5, dash: 0, dashCooldown: 0,
      attack: 0, attackCooldown: 0, attackId: 0, coyote: 0.12, jumpBuffer: 0, healCooldown: 0,
    };
    this.enemies = ENEMY_STARTS.map((e, id) => ({ ...e, id, y: e.y ?? FLOOR, baseY: e.y ?? FLOOR, vx: 0, dir: id % 2 ? -1 : 1, hp: e.kind === 'knight' ? 4 : e.kind === 'fly' ? 2 : 3, alive: !this.kills.has(id), hit: 0, lastAttack: -1, phase: id * 1.3, cooldown: 0 }));
    this.collectibles = makeCollectibles().map(c => ({ ...c, taken: s?.taken.includes(c.id) ?? false }));
    this.boss = { x: 6290, y: FLOOR, hp: s?.bossDefeated ? 0 : 30, maxHp: 30, active: false, alive: !s?.bossDefeated, phase: 'idle', timer: 1.2, direction: -1, hit: 0, lastAttack: -1, vy: 0 };
    this.projectiles = [];
    this.effects = [];
    this.cameraX = Math.max(0, this.player.x - 635);
    this.region = this.getRegion();
    this.visited = new Set([this.region]);
    this.context = null;
    this.eventId = 0;
    this.healHint = 0;
    this.updateContext();
  }

  emit(type, data = {}) {
    this.onEvent({ type, ...data });
  }

  getRegion() { return Math.min(3, REGIONS.findIndex(r => this.player.x >= r.from && this.player.x < r.to) === -1 ? 3 : REGIONS.findIndex(r => this.player.x >= r.from && this.player.x < r.to)); }

  serialize() {
    return { version: 1, bells: this.bells, shells: this.shells, checkpoint: this.checkpoint, tools: [...this.tools], kills: [...this.kills], taken: this.collectibles.filter(c => c.taken).map(c => c.id), deaths: this.deaths, time: this.time, won: this.hasWon, completed: this.status === 'won', bossDefeated: !this.boss.alive, steel: this.steel };
  }

  snapshot() {
    const p = this.player;
    return { health: p.health, maxHealth: p.maxHealth, lumen: Math.round(p.lumen), shells: this.shells, bells: [...this.bells], region: this.region, x: p.x, tools: [...this.tools], kills: this.kills.size, deaths: this.deaths, status: this.status, context: this.context, time: this.time, boss: this.boss.active && this.boss.alive ? { health: this.boss.hp, max: this.boss.maxHp, phase: this.boss.phase } : null, hasWon: this.hasWon, steel: this.steel };
  }

  effect(type, x, y, extra = {}) {
    this.effects.push({ id: this.eventId++, type, x, y, age: 0, life: type === 'ring' ? 1.6 : type === 'heal' ? 1 : 0.5, ...extra });
    if (this.effects.length > 65) this.effects.splice(0, this.effects.length - 65);
  }

  update(dt, input = {}) {
    if (this.status !== 'playing') return;
    this.time += dt;
    const p = this.player;
    for (const k of ['invulnerable', 'dashCooldown', 'attack', 'attackCooldown', 'coyote', 'jumpBuffer', 'healCooldown']) p[k] = Math.max(0, p[k] - dt);
    this.healHint = Math.max(0, this.healHint - dt);
    this.effects.forEach(e => { e.age += dt; });
    this.effects = this.effects.filter(e => e.age < e.life);

    if (input.jumpPressed) p.jumpBuffer = 0.14;
    if (p.jumpBuffer > 0 && (p.grounded || p.coyote > 0 || p.jumps < 2)) {
      if (p.grounded || p.coyote > 0) p.jumps = 0;
      p.vy = p.jumps === 0 ? 570 : 495;
      p.jumps++;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      this.effect('jump', p.x, p.y);
      this.emit('jump');
    }
    if (input.jumpReleased && p.vy > 220) p.vy *= 0.58;
    const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
    if (direction) p.facing = direction;
    if (input.dashPressed && p.dashCooldown === 0) {
      p.dash = 0.17;
      p.dashCooldown = 0.7;
      p.invulnerable = Math.max(p.invulnerable, 0.23);
      this.effect('dash', p.x, p.y + 26, { direction: p.facing });
      this.emit('dash');
    }

    if (p.dash > 0) { p.dash -= dt; p.vx = p.facing * 840; p.vy = 0; }
    else {
      const target = direction * 275;
      p.vx += (target - p.vx) * Math.min(1, (p.grounded ? 20 : 12) * dt);
      p.vy = Math.max(-880, p.vy - 1470 * dt);
    }

    if (input.attack && p.attackCooldown === 0) {
      p.attack = 0.19;
      p.attackCooldown = 0.32;
      p.attackId++;
      this.effect('slash', p.x + p.facing * 37, p.y + 42, { direction: p.facing });
      this.emit('attack');
    }
    if (input.healPressed) this.heal();
    if (input.toolPressed) this.throwPrism();

    const oldY = p.y;
    p.x = clamp(p.x + p.vx * dt, 45, WORLD_WIDTH - 55);
    if (!this.bells.every(Boolean) && p.x > 5475) {
      p.x = 5475;
      if (this.healHint <= 0) { this.emit('toast', { text: 'Three bells must sing before the High Lantern will open.' }); this.healHint = 5; }
    }
    p.y += p.vy * dt;
    const wasGrounded = p.grounded;
    p.grounded = false;
    if (p.vy <= 0) {
      for (const platform of PLATFORMS) {
        if (p.x + p.w / 2 > platform.x && p.x - p.w / 2 < platform.x + platform.w && oldY >= platform.y - 1 && p.y <= platform.y) {
          p.y = platform.y; p.vy = 0; p.grounded = true; p.jumps = 0; p.coyote = 0.12;
          if (!wasGrounded) this.effect('land', p.x, p.y);
          break;
        }
      }
    }
    if (wasGrounded && !p.grounded) { p.coyote = 0.12; p.jumps = Math.max(1, p.jumps); }
    if (p.y < -150) {
      this.damage(1, p.x);
      if (this.status === 'playing') { p.x = this.checkpoint.x; p.y = FLOOR; p.vy = 0; p.invulnerable = 2; }
    }

    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    for (const c of this.collectibles) {
      if (!c.taken && Math.abs(c.x - p.x) < 38 && Math.abs(c.y - (p.y + 30)) < 51) {
        c.taken = true; this.shells += 3;
        this.effect('collect', c.x, c.y); this.emit('collect');
      }
    }
    if (this.tools.has('spool')) p.lumen = Math.min(100, p.lumen + dt * 3.5);
    const region = this.getRegion();
    if (this.region !== region) {
      this.region = region; this.visited.add(region);
      this.emit('region', { region, name: REGIONS[region].name });
    }
    this.updateContext();
    if (input.interactPressed) this.interact();
  }

  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.hit = Math.max(0, e.hit - dt);
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.phase += dt;
      const speed = e.kind === 'fly' ? 54 : e.kind === 'knight' ? 47 : 35;
      e.x += e.dir * speed * dt;
      if (e.x < e.min) { e.x = e.min; e.dir = 1; }
      if (e.x > e.max) { e.x = e.max; e.dir = -1; }
      if (e.kind === 'fly') e.y = e.baseY + Math.sin(e.phase * 2.2) * 35;
      const enemyH = e.kind === 'knight' ? 64 : 42;
      if (p.attack > 0.03 && e.lastAttack !== p.attackId && (e.x - p.x) * p.facing > -28 && Math.abs(e.x - p.x) < 111 && p.y < e.y + enemyH && p.y + p.h > e.y - 12) {
        e.lastAttack = p.attackId;
        this.hitEnemy(e, this.tools.has('prism') ? 2 : 1);
      }
      if (e.alive && Math.abs(e.x - p.x) < 33 && p.y < e.y + enemyH - 7 && p.y + p.h > e.y + 6) this.damage(this.steel ? 2 : 1, e.x);
    }
  }

  hitEnemy(e, amount) {
    e.hp -= amount; e.hit = 0.18;
    e.x = clamp(e.x + this.player.facing * 17, e.min, e.max);
    this.player.lumen = Math.min(100, this.player.lumen + 9);
    this.effect('hit', e.x, e.y + 25);
    this.emit('hit');
    if (e.hp <= 0) {
      e.alive = false; this.kills.add(e.id); this.shells += e.kind === 'knight' ? 18 : 12;
      this.effect('burst', e.x, e.y + 25); this.emit('defeat', { kind: e.kind });
    }
  }

  updateBoss(dt) {
    const b = this.boss, p = this.player;
    if (!b.alive) return;
    if (!b.active && p.x > 5800 && this.bells.every(Boolean)) {
      b.active = true; this.emit('boss');
    }
    if (!b.active) return;
    b.hit = Math.max(0, b.hit - dt);
    b.timer -= dt;
    if (b.phase === 'idle' && b.timer <= 0) {
      b.phase = 'windup'; b.timer = b.hp < 15 ? 0.65 : 0.95;
      b.direction = Math.sign(p.x - b.x) || -1;
      this.effect('warning', b.x, b.y + 90, { life: 1 });
      this.emit('boss-windup');
    } else if (b.phase === 'windup' && b.timer <= 0) {
      b.phase = 'charge'; b.timer = 0.65;
      this.emit('dash');
    } else if (b.phase === 'charge') {
      b.x = clamp(b.x + b.direction * (b.hp < 15 ? 650 : 510) * dt, 5680, 6670);
      if (b.timer <= 0) { b.phase = 'recover'; b.timer = 1.2; }
    } else if (b.phase === 'recover' && b.timer <= 0) {
      b.phase = 'jump'; b.vy = 610;
    } else if (b.phase === 'jump') {
      b.vy -= 1270 * dt; b.y += b.vy * dt;
      if (b.y <= FLOOR) {
        b.y = FLOOR; b.phase = 'idle'; b.timer = 1.5;
        this.effect('slam', b.x, FLOOR);
        for (const d of [-1, 1]) this.projectiles.push({ x: b.x, y: FLOOR + 14, vx: d * 245, life: 3.5, hostile: true });
        this.emit('slam');
      }
    }
    if (p.attack > 0.03 && b.lastAttack !== p.attackId && Math.abs(b.x - p.x) < 136 && (b.x - p.x) * p.facing > -45 && p.y < b.y + 116 && p.y + p.h > b.y) {
      b.lastAttack = p.attackId; this.hitBoss(this.tools.has('prism') ? 2 : 1);
    }
    if (b.alive && Math.abs(b.x - p.x) < 57 && p.y < b.y + 104 && p.y + p.h > b.y + 10) this.damage(this.steel ? 2 : 1, b.x);
  }

  hitBoss(amount) {
    const b = this.boss;
    b.hp = Math.max(0, b.hp - amount); b.hit = 0.18;
    this.player.lumen = Math.min(100, this.player.lumen + 10);
    this.effect('hit', b.x, b.y + 65); this.emit('hit');
    if (b.hp === 0) {
      b.alive = false; b.active = false; this.projectiles = this.projectiles.filter(p => !p.hostile);
      this.shells += 100; this.player.health = this.player.maxHealth;
      this.effect('ring', b.x, b.y + 75); this.emit('boss-defeated'); this.emit('save');
    }
  }

  updateProjectiles(dt) {
    for (const shot of this.projectiles) {
      shot.x += shot.vx * dt; shot.life -= dt;
      if (shot.hostile) {
        const p = this.player;
        if (Math.abs(shot.x - p.x) < 29 && p.y < shot.y + 17 && p.y + p.h > shot.y) { this.damage(1, shot.x); shot.life = 0; }
      } else {
        for (const e of this.enemies) {
          if (e.alive && Math.abs(shot.x - e.x) < 38 && Math.abs(shot.y - e.y - 27) < 37) { this.hitEnemy(e, 2); shot.life = 0; break; }
        }
        const b = this.boss;
        if (shot.life > 0 && b.alive && b.active && Math.abs(shot.x - b.x) < 60 && shot.y > b.y && shot.y < b.y + 135) { this.hitBoss(2); shot.life = 0; }
      }
    }
    this.projectiles = this.projectiles.filter(s => s.life > 0);
  }

  damage(amount, fromX) {
    const p = this.player;
    if (p.invulnerable > 0 || this.status !== 'playing') return;
    p.health = Math.max(0, p.health - amount); p.invulnerable = 1.4; p.vx = (Math.sign(p.x - fromX) || -1) * 250;
    this.effect('damage', p.x, p.y + 35); this.emit('damage');
    if (p.health === 0) {
      this.status = 'dead'; this.deaths++;
      this.shells = Math.floor(this.shells * (this.steel ? 0.5 : 0.85));
      this.emit('dead');
    }
  }

  heal() {
    const p = this.player;
    if (p.health === p.maxHealth) { this.emit('toast', { text: 'Your thread is whole. Every mask is restored.' }); return false; }
    if (p.healCooldown > 0) return false;
    if (p.lumen < 33) { this.emit('toast', { text: 'You need 33 lumen to bind. Strike enemies to gather lumen.' }); return false; }
    p.lumen -= 33; p.health = Math.min(p.maxHealth, p.health + 2); p.healCooldown = 1; p.invulnerable = Math.max(p.invulnerable, 0.7);
    this.effect('heal', p.x, p.y + 35); this.emit('heal'); return true;
  }

  throwPrism() {
    const p = this.player;
    if (p.lumen < 20) { this.emit('toast', { text: 'You need 20 lumen to cast a thread.' }); return false; }
    p.lumen -= 20;
    this.projectiles.push({ x: p.x + p.facing * 25, y: p.y + 34, vx: p.facing * 660, life: 1.2, hostile: false });
    this.emit('throw'); return true;
  }

  updateContext() {
    const p = this.player;
    this.context = null;
    for (const s of SHRINES) if (Math.abs(p.x - s.x) < 95 && Math.abs(p.y - s.y) < 85) this.context = { type: 'bell', id: s.id, label: this.bells[s.id] ? 'Rest at the bell' : 'Ring the bell', name: s.name };
    for (let i = 0; i < BENCHES.length; i++) if (Math.abs(p.x - BENCHES[i].x) < 72 && Math.abs(p.y - FLOOR) < 60) this.context = { type: 'bench', id: i, label: 'Rest & save', name: 'Pilgrim’s rest' };
    if (Math.abs(p.x - 770) < 68 && Math.abs(p.y - FLOOR) < 50) this.context = { type: 'npc', label: 'Listen', name: 'Olli the Glazier' };
    if (p.x > 6800 && !this.boss.alive) this.context = { type: 'exit', label: 'Ascend', name: 'The High Lantern' };
  }

  interact() {
    const c = this.context;
    if (!c) return;
    if (c.type === 'bell') {
      const first = !this.bells[c.id]; this.bells[c.id] = true;
      this.checkpoint = { x: SHRINES[c.id].x - 66, y: FLOOR };
      this.player.health = this.player.maxHealth; this.player.lumen = 100;
      if (first) this.shells += 20;
      this.effect('ring', SHRINES[c.id].x, FLOOR + 85);
      this.emit('bell', { id: c.id, first }); this.emit('save');
    } else if (c.type === 'bench') {
      this.checkpoint = { x: BENCHES[c.id].x + 45, y: FLOOR };
      this.player.health = this.player.maxHealth; this.player.lumen = 100;
      this.effect('heal', this.player.x, this.player.y + 40); this.emit('rest'); this.emit('save');
    } else if (c.type === 'npc') {
      this.emit('dialogue', { name: 'Olli the Glazier', text: 'Little wanderer… this kingdom has forgotten its own song. Wake the three bells along the pilgrim’s road, and the way to the High Lantern will open. Take heart. Even a single thread can mend a broken world.' });
    } else if (c.type === 'exit') {
      this.status = 'won'; this.hasWon = true; this.emit('won'); this.emit('save');
    }
    this.updateContext();
  }

  craft(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool || this.tools.has(id) || this.shells < tool.cost) return false;
    this.shells -= tool.cost; this.tools.add(id);
    if (id === 'heart') { this.player.maxHealth = 6; this.player.health = 6; }
    this.emit('crafted', { name: tool.name }); this.emit('save'); return true;
  }

  respawn() {
    this.status = 'playing';
    Object.assign(this.player, { x: this.checkpoint.x, y: FLOOR, vx: 0, vy: 0, health: this.player.maxHealth, lumen: 66, invulnerable: 2, grounded: true, jumps: 0, dash: 0, attack: 0 });
    if (this.boss.alive) Object.assign(this.boss, { x: 6290, y: FLOOR, hp: 30, active: false, phase: 'idle', timer: 1.2 });
    this.projectiles = []; this.effects = [];
    this.region = this.getRegion(); this.updateContext(); this.emit('save');
  }
}
