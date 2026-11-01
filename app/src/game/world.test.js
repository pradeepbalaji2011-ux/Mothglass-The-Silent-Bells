import test from 'node:test';
import assert from 'node:assert/strict';
import { World, FLOOR, STEP, SHRINES, cleanSave } from './world.js';

function advance(world, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds / STEP); i++) world.update(STEP, input);
}

test('movement converges to run speed and stops without drifting', () => {
  const world = new World();
  advance(world, 0.7, { right: true });
  assert.ok(world.player.x > 785 && world.player.x < 830);
  assert.equal(world.player.y, FLOOR);
  advance(world, 0.7);
  assert.ok(Math.abs(world.player.vx) < 0.1);
  assert.equal(world.player.health, 5);
});

test('variable jumps, double jump, and landing preserve their state', () => {
  const full = new World(), short = new World();
  full.update(STEP, { jumpPressed: true });
  short.update(STEP, { jumpPressed: true });
  short.update(STEP, { jumpReleased: true });
  advance(full, 0.2); advance(short, 0.2);
  assert.ok(full.player.y > short.player.y + 30);
  full.update(STEP, { jumpPressed: true });
  assert.equal(full.player.jumps, 2);
  const vy = full.player.vy;
  full.update(STEP, { jumpPressed: true });
  assert.ok(full.player.vy < vy, 'a third airborne jump is not allowed');
  advance(full, 1.8);
  assert.equal(full.player.y, FLOOR);
  assert.equal(full.player.jumps, 0);
});

test('jump buffering lands and then immediately jumps; coyote time works at a ledge', () => {
  const world = new World();
  world.player.y = FLOOR + 1; world.player.vy = -250;
  world.player.grounded = false; world.player.jumps = 2; world.player.coyote = 0;
  world.update(STEP, { jumpPressed: true });
  world.update(STEP, {});
  assert.ok(world.player.vy > 450, 'buffered jump fires after landing');
  const ledge = new World();
  Object.assign(ledge.player, { x: 972, y: FLOOR, grounded: true });
  ledge.update(STEP, { right: true });
  assert.ok(ledge.player.coyote > 0);
  ledge.update(STEP, { jumpPressed: true });
  assert.ok(ledge.player.vy > 500);
});

test('dash crosses a gap, provides brief invulnerability, and respects cooldown', () => {
  const world = new World();
  Object.assign(world.player, { x: 920, y: FLOOR + 70, grounded: false, invulnerable: 0 });
  world.update(STEP, { dashPressed: true, right: true });
  assert.ok(world.player.dash > 0);
  world.damage(1, 930);
  assert.equal(world.player.health, 5);
  advance(world, 0.15, { right: true });
  assert.ok(world.player.x > 1040);
  const cooldown = world.player.dashCooldown;
  world.update(STEP, { dashPressed: true });
  assert.ok(world.player.dashCooldown < cooldown);
});

test('each swing hits an enemy once, and kills award currency once', () => {
  const world = new World();
  const enemy = world.enemies[0];
  Object.assign(world.player, { x: enemy.x - 70, facing: 1 });
  world.update(STEP, { attack: true });
  assert.equal(enemy.hp, 2);
  advance(world, 0.14, { attack: true });
  assert.equal(enemy.hp, 2);
  for (let i = 0; i < 2; i++) {
    advance(world, 0.34);
    world.player.x = enemy.x - 65;
    world.update(STEP, { attack: true });
  }
  assert.equal(enemy.alive, false);
  assert.equal(world.kills.size, 1);
  assert.equal(world.shells, 12);
  advance(world, 1, { attack: true });
  assert.equal(world.shells, 12);
});

test('a prism swing does not damage a foe behind the player', () => {
  const world = new World();
  const enemy = world.enemies[0];
  Object.assign(world.player, { x: enemy.x + 60, facing: 1 });
  advance(world, 0.12, { attack: true });
  assert.equal(enemy.hp, 3);
});

test('binding spends lumen only when it restores health', () => {
  const world = new World();
  assert.equal(world.heal(), false);
  assert.equal(world.player.lumen, 75);
  world.player.health = 2;
  assert.equal(world.heal(), true);
  assert.equal(world.player.health, 4);
  assert.equal(world.player.lumen, 42);
  assert.equal(world.heal(), false);
  world.player.healCooldown = 0; world.player.lumen = 32;
  assert.equal(world.heal(), false);
});

test('bells ring once, restore health, and open the path only after all three', () => {
  const world = new World();
  world.player.x = 5500;
  world.update(STEP, {});
  assert.equal(world.player.x, 5475);
  const initialShells = world.shells;
  for (const shrine of SHRINES) {
    Object.assign(world.player, { x: shrine.x, y: FLOOR, health: 1, lumen: 0 });
    world.updateContext(); world.interact();
    assert.equal(world.player.health, 5);
    assert.equal(world.player.lumen, 100);
    assert.equal(world.bells[shrine.id], true);
    const shells = world.shells;
    world.interact(); assert.equal(world.shells, shells);
  }
  assert.equal(world.shells, initialShells + 60);
  world.player.x = 5510;
  world.update(STEP, {});
  assert.ok(world.player.x > 5475);
});

test('crafting requires funds, cannot duplicate a tool, and persists', () => {
  const world = new World();
  assert.equal(world.craft('prism'), false);
  assert.equal(world.craft('unknown'), false);
  world.shells = 90;
  assert.equal(world.craft('prism'), true);
  assert.equal(world.shells, 45);
  assert.equal(world.craft('prism'), false);
  assert.equal(world.craft('heart'), true);
  assert.equal(world.player.maxHealth, 6);
  const loaded = new World(world.serialize());
  assert.equal(loaded.player.maxHealth, 6);
  assert.ok(loaded.tools.has('prism'));
  assert.equal(loaded.shells, 10);
});

test('the boss telegraphs before charging, produces a jumpable shockwave, and resets on death', () => {
  const world = new World();
  world.bells = [true, true, true]; world.player.x = 5820;
  world.update(STEP, {});
  assert.equal(world.boss.active, true);
  advance(world, 1.25);
  assert.equal(world.boss.phase, 'windup');
  const x = world.boss.x;
  advance(world, 0.5);
  assert.equal(world.boss.x, x);
  advance(world, 0.5);
  assert.equal(world.boss.phase, 'charge');
  Object.assign(world.boss, { phase: 'jump', y: FLOOR + 1, vy: -20 });
  advance(world, 0.1);
  assert.equal(world.projectiles.filter(p => p.hostile).length, 2);
  world.player.invulnerable = 0; world.player.health = 1;
  world.damage(1, world.player.x + 5);
  assert.equal(world.status, 'dead');
  world.respawn();
  assert.equal(world.status, 'playing');
  assert.equal(world.player.health, 5);
  assert.equal(world.boss.hp, 30);
  assert.equal(world.boss.active, false);
  assert.equal(world.projectiles.length, 0);
});

test('a complete pilgrimage can win and retain its completion unlock', () => {
  const events = [], world = new World(null, e => events.push(e));
  for (const shrine of SHRINES) { Object.assign(world.player, { x: shrine.x, y: FLOOR }); world.updateContext(); world.interact(); }
  world.player.x = 5820; world.update(STEP, {});
  world.hitBoss(30);
  assert.equal(world.boss.alive, false);
  assert.ok(events.some(e => e.type === 'boss-defeated'));
  assert.equal(new World(world.serialize()).boss.alive, false, 'a defeated guardian stays defeated on reload');
  world.player.x = 6860; world.updateContext(); world.interact();
  assert.equal(world.status, 'won');
  assert.equal(world.hasWon, true);
  assert.ok(events.some(e => e.type === 'won'));
  const restored = new World(world.serialize());
  assert.equal(restored.hasWon, true);
  assert.equal(restored.status, 'won');
  assert.equal(restored.boss.alive, false);
});

test('malformed saves are safely rejected or sanitized', () => {
  assert.equal(cleanSave(null), null);
  assert.equal(cleanSave({ version: 2 }), null);
  const loaded = new World({ version: 1, checkpoint: { x: NaN }, shells: -500, bells: [true, 'true'], tools: ['heart', 'cheat'], taken: [99, null, '1'], kills: [-1, 8], time: Infinity });
  assert.equal(loaded.player.x, 635);
  assert.equal(loaded.shells, 0);
  assert.deepEqual(loaded.bells, [true, false, false]);
  assert.deepEqual([...loaded.tools], ['heart']);
  assert.equal(loaded.collectibles.some(c => c.taken), false);
  assert.deepEqual([...loaded.kills], [8]);
  assert.equal(loaded.time, 0);
  assert.deepEqual(new World({ version: 1, tools: { prism: true } }).snapshot().tools, []);
});
