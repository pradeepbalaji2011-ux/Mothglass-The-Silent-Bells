import { World, SAVE_KEY, STEP } from './world';
import { GameRenderer } from './renderer';
import { Soundscape } from './audio';

const KEY_MAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyJ: 'attack', KeyX: 'attack', ShiftLeft: 'dash', ShiftRight: 'dash', KeyK: 'dash', KeyC: 'dash', KeyE: 'interact', KeyQ: 'heal', KeyF: 'tool' };

export function readSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
}

export class GameEngine {
  constructor(canvas, { onState, onEvent, onReady, onError, saved = readSave() }) {
    this.canvas = canvas;
    this.onState = onState;
    this.onEvent = onEvent;
    this.paused = false;
    this.disposed = false;
    this.running = false;
    this.pressed = new Set();
    this.down = new Set();
    this.keyboardDown = new Set();
    this.touchDown = new Set();
    this.released = new Set();
    this.sound = new Soundscape();
    this.world = new World(saved, e => this.handleEvent(e));
    this.capture = new URLSearchParams(window.location.search).has('capture');
    window.__seek = time => {
      if (!Number.isFinite(time) || !this.renderer) return;
      this.visualTime = Math.max(0, time);
      this.renderer.render(this.world, 0, this.visualTime);
    };
    this.keyDown = e => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey || this.paused) return;
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();
      this.sound.start();
      if (!this.keyboardDown.has(e.code)) { this.keyboardDown.add(e.code); this.pressed.add(action); }
      this.down.add(action);
    };
    this.keyUp = e => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      this.keyboardDown.delete(e.code);
      if (![...this.keyboardDown].some(code => KEY_MAP[code] === action) && !this.touchDown.has(action)) { this.down.delete(action); this.released.add(action); }
    };
    this.blur = () => { this.clearInput(); if (this.running && this.world.status === 'playing') this.onEvent({ type: 'blur' }); };
    this.visibility = () => { if (document.hidden) this.blur(); };
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.visibility);
    try {
      this.renderer = new GameRenderer(canvas, () => {
        if (this.disposed) return;
        this.running = true;
        if (this.capture) {
          const requested = new URLSearchParams(window.location.search).get('t');
          const time = requested === null ? 0 : Number(requested);
          this.visualTime = Number.isFinite(time) ? Math.max(0, time) : 0;
          this.renderer.render(this.world, 0, this.visualTime);
        }
        window.__SCENE_READY__ = true;
        window.__GAME_READY__ = true;
        onReady();
        if (this.world.status === 'won') this.onEvent({ type: 'won' });
      }, error => onError(error.message));
    } catch (error) { onError(error.message); }
    this.lastFrame = performance.now(); this.accumulator = 0; this.stateTimer = 0; this.saveTimer = 0; this.visualTime = 0;
    this.frame = this.frame.bind(this);
    if (!this.capture) this.raf = requestAnimationFrame(this.frame);
    this.onState(this.world.snapshot());
  }

  handleEvent(event) {
    this.sound.play(event.type);
    if (event.type === 'save') this.save();
    else this.onEvent(event);
  }

  press(action) {
    if (this.paused || this.world.status !== 'playing') return;
    this.sound.start(); this.touchDown.add(action); this.down.add(action); this.pressed.add(action);
  }

  release(action) {
    this.touchDown.delete(action);
    if (![...this.keyboardDown].some(code => KEY_MAP[code] === action)) { this.down.delete(action); this.released.add(action); }
  }

  tap(action) { this.press(action); window.setTimeout(() => { if (!this.disposed) this.release(action); }, 90); }

  clearInput() { this.down.clear(); this.keyboardDown.clear(); this.touchDown.clear(); this.pressed.clear(); this.released.clear(); }

  setPaused(paused) { this.paused = paused; this.clearInput(); this.accumulator = 0; }

  frame(now) {
    if (this.disposed) return;
    const dt = Math.min(0.066, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    if (this.running && !this.paused) {
      this.accumulator = Math.min(0.1, this.accumulator + dt);
      while (this.accumulator >= STEP) {
        this.world.update(STEP, { left: this.down.has('left'), right: this.down.has('right'), attack: this.down.has('attack'), jumpPressed: this.pressed.has('jump'), jumpReleased: this.released.has('jump'), dashPressed: this.pressed.has('dash'), interactPressed: this.pressed.has('interact'), healPressed: this.pressed.has('heal'), toolPressed: this.pressed.has('tool') });
        this.pressed.clear(); this.released.clear(); this.accumulator -= STEP;
      }
      this.saveTimer += dt;
      if (this.saveTimer > 15) { this.save(true); this.saveTimer = 0; }
    }
    this.visualTime += dt;
    this.renderer?.render(this.world, dt, this.visualTime);
    this.stateTimer += dt;
    if (this.stateTimer > 0.08) { this.onState(this.world.snapshot()); this.stateTimer = 0; }
    this.raf = requestAnimationFrame(this.frame);
  }

  save(silent = false) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.world.serialize())); if (!silent) this.onEvent({ type: 'saved' }); }
    catch { this.onEvent({ type: 'save-unavailable' }); }
  }

  craft(id) { const ok = this.world.craft(id); this.onState(this.world.snapshot()); return ok; }

  respawn() { this.world.respawn(); this.setPaused(false); this.onState(this.world.snapshot()); this.canvas.focus({ preventScroll: true }); }

  restart(steel = false) {
    const won = this.world.hasWon;
    this.world = new World(null, e => this.handleEvent(e));
    this.world.hasWon = won; this.world.steel = steel;
    this.setPaused(false); this.save(); this.onState(this.world.snapshot()); this.canvas.focus({ preventScroll: true });
  }

  dispose() {
    this.save(true); this.disposed = true;
    cancelAnimationFrame(this.raf); this.clearInput();
    window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp); window.removeEventListener('blur', this.blur); document.removeEventListener('visibilitychange', this.visibility);
    this.renderer?.dispose(); this.sound.dispose();
    delete window.__seek;
    delete window.__SCENE_READY__;
    delete window.__GAME_READY__;
  }
}
