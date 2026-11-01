export class Soundscape {
  constructor() { this.ctx = null; this.enabled = true; this.volume = 0.35; this.timer = null; this.note = 0; }

  start() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain(); this.master.gain.value = this.volume * 0.3; this.master.connect(this.ctx.destination);
        this.delay = this.ctx.createDelay(2); this.delay.delayTime.value = 0.48;
        const feedback = this.ctx.createGain(); feedback.gain.value = 0.26;
        this.delay.connect(feedback); feedback.connect(this.delay); this.delay.connect(this.master);
        this.scheduleAmbience(); this.timer = window.setInterval(() => this.scheduleAmbience(), 4600);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch { /* The game remains playable when audio is unavailable. */ }
  }

  tone(freq, length, type = 'sine', gain = 0.3, when = 0, endFreq) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + when;
    const oscillator = this.ctx.createOscillator(), envelope = this.ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, t);
    if (endFreq) oscillator.frequency.exponentialRampToValueAtTime(endFreq, t + length);
    envelope.gain.setValueAtTime(0, t); envelope.gain.linearRampToValueAtTime(gain, t + Math.min(0.08, length * 0.18)); envelope.gain.exponentialRampToValueAtTime(0.001, t + length);
    oscillator.connect(envelope); envelope.connect(this.master); envelope.connect(this.delay);
    oscillator.start(t); oscillator.stop(t + length + 0.05);
  }

  scheduleAmbience() {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const roots = [146.83, 130.81, 110, 130.81];
    const root = roots[this.note % 4];
    this.tone(root / 2, 5.5, 'sine', 0.12);
    this.tone(root, 5, 'sine', 0.085);
    this.tone(root * 1.5, 4.8, 'sine', 0.04, 0.3);
    this.tone(root * 3, 3, 'sine', 0.1, 0.7);
    this.tone(root * 2, 2.6, 'sine', 0.08, 2.7);
    this.note++;
  }

  play(kind) {
    if (!this.enabled) return;
    this.start();
    if (!this.ctx) return;
    switch (kind) {
      case 'jump': this.tone(210, 0.14, 'sine', 0.15, 0, 420); break;
      case 'attack': this.tone(740, 0.12, 'triangle', 0.11, 0, 110); break;
      case 'dash': this.tone(380, 0.18, 'triangle', 0.08, 0, 80); break;
      case 'hit': this.tone(170, 0.12, 'triangle', 0.22, 0, 55); break;
      case 'collect': this.tone(960, 0.35, 'sine', 0.17); this.tone(1280, 0.3, 'sine', 0.1, 0.06); break;
      case 'damage': this.tone(120, 0.32, 'sawtooth', 0.09, 0, 48); break;
      case 'bell': case 'rest': case 'heal': case 'crafted': this.tone(587.33, 2.2, 'sine', 0.22); this.tone(880, 2, 'sine', 0.1, 0.1); this.tone(1174, 2, 'sine', 0.08, 0.2); break;
      case 'throw': this.tone(900, 0.2, 'sine', 0.12, 0, 300); break;
      case 'slam': this.tone(65, 0.7, 'triangle', 0.3, 0, 28); break;
      case 'boss-windup': this.tone(190, 0.65, 'sine', 0.12, 0, 350); break;
      case 'won': case 'boss-defeated': [293.66, 349.23, 440, 587.33].forEach((f, i) => this.tone(f, 3, 'sine', 0.2, i * 0.2)); break;
      default: break;
    }
  }

  setEnabled(value) {
    this.enabled = value;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(value ? this.volume * 0.3 : 0, this.ctx.currentTime, 0.1);
    if (value && (this.ctx || window.navigator.userActivation?.hasBeenActive)) this.start();
  }

  setVolume(value) {
    this.volume = value;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? value * 0.3 : 0, this.ctx.currentTime, 0.1);
  }

  dispose() { if (this.timer) window.clearInterval(this.timer); this.ctx?.close().catch(() => {}); }
}
