import * as THREE from 'three';
import { BENCHES, FLOOR, PLATFORMS, REGIONS, SHRINES, WORLD_WIDTH } from './world';
import { bellTexture, benchTexture, bossTexture, enemyTexture, foliageTexture, velaTexture, moteTexture, npcTexture, platformTexture, random } from './art';

const VIEW_HEIGHT = 620;
function hasHardwareGraphics() {
  const probe = document.createElement('canvas');
  let gl;
  try {
    gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : '';
    return !/swiftshader|llvmpipe|software|softpipe/i.test(renderer);
  } catch { return false; }
  finally { gl?.getExtension('WEBGL_lose_context')?.loseContext(); }
}
const fogVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fogFragment = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uTint;
  void main(){
    float wave=sin(vUv.x*10.0+vUv.y*7.0+uTime*.07)*.5+.5;
    float mist=sin(vUv.x*17.0-vUv.y*12.0-uTime*.06)*.5+.5;
    float base=(1.0-smoothstep(.0,.43,vUv.y))*.065;
    float beam1=pow(max(0.0,1.0-abs(vUv.x-vUv.y*.22-.31)*9.0),3.0);
    float beam2=pow(max(0.0,1.0-abs(vUv.x-vUv.y*.2-.61)*13.0),3.0);
    float light=(beam1+beam2)*.065*(.8+sin(uTime*.22)*.2);
    gl_FragColor=vec4(uTint,base*wave+mist*.012+light);
  }`;

export class GameRenderer {
  constructor(canvas, onReady, onError) {
    this.canvas = canvas;
    this.disposed = false;
    this.reducedMotion = false;
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#1e1421');
    this.camera = new THREE.OrthographicCamera(0, 1280, VIEW_HEIGHT, 0, 0.1, 250);
    this.camera.position.z = 100;
    const forceWebGL = new URLSearchParams(window.location.search).has('webgl');
    this.useCanvas = !forceWebGL && !hasHardwareGraphics();
    this.stats = { frames: 0, mode: this.useCanvas ? 'canvas' : 'webgl', calls: 0 };
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, this.useCanvas ? 1.35 : 1.7);
    if (this.useCanvas) {
      this.ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
      if (!this.ctx) throw new Error('This browser does not support a drawing surface.');
    } else {
      this.webgl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.webgl.setPixelRatio(this.pixelRatio);
      this.webgl.outputColorSpace = THREE.SRGBColorSpace;
      this.webgl.setClearColor('#1e1421');
    }
    this.viewWidth = 1280;
    this.maps = [];
    this.managedTextures = new Set();
    this.dynamicEffects = new Map();
    this.projectileSprites = [];
    this.shake = 0;
    this.lastRegion = 0;
    this.crossfade = 1;
    this.buildScene();
    const loader = new THREE.TextureLoader();
    const textureUrl = `${import.meta.env.BASE_URL}art/original-scene.png`;
    loader.load(
      textureUrl,
      texture => {
        if (this.disposed) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        this.managedTextures.add(texture);
        this.maps = [texture, texture, texture, texture];
        if (this.background?.material) {
          this.background.material.map = texture;
          this.background.material.needsUpdate = true;
        }
        if (this.previousBg?.material) {
          this.previousBg.material.map = texture;
          this.previousBg.material.needsUpdate = true;
        }
      },
      undefined,
      err => {
        console.warn('Background art could not be loaded, using procedural palette:', err);
      }
    );
    this.ready = Promise.resolve();
    setTimeout(() => onReady(), 50);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement);
    this.resize();
    this.contextLost = e => { e.preventDefault(); onError(new Error('The graphics context was interrupted. Please reload the adventure.')); };
    if (!this.useCanvas) canvas.addEventListener('webglcontextlost', this.contextLost);
  }

  remember(map) { this.managedTextures.add(map); return map; }

  sprite(map, width, height, x, y, z = 0, opacity = 1) {
    if (map) this.remember(map);
    const mat = new THREE.MeshBasicMaterial({ map: map || null, transparent: true, depthWrite: false, opacity, color: '#ffffff', side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(this.geometry, mat);
    mesh.scale.set(width, height, 1); mesh.position.set(x, y, z);
    this.scene.add(mesh); return mesh;
  }

  buildScene() {
    this.previousBg = this.sprite(null, 1600, 660, 700, 330, -42, 0);
    this.background = this.sprite(null, 1600, 660, 700, 330, -41);
    this.previousBg.material.color.set('#dfd5e2');
    this.background.material.color.set('#eadeed');
    this.fogMaterial = new THREE.ShaderMaterial({ vertexShader: fogVertex, fragmentShader: fogFragment, uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Color('#e4cbea') } }, transparent: true, depthWrite: false });
    this.fog = new THREE.Mesh(this.geometry, this.fogMaterial); this.fog.position.z = -8; this.scene.add(this.fog);

    // Suspended dew prisms add true geometric depth behind the illustrated play layer.
    this.glassPrisms = [];
    const glassRandom = random(9341);
    const glassGeometry = new THREE.OctahedronGeometry(1, 0);
    const glassMaterial = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal;varying vec3 vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
      fragmentShader: `varying vec3 vNormal;varying vec3 vView;void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.2);float facet=.5+.5*abs(vNormal.y);vec3 tint=mix(vec3(.72,.52,.75),vec3(1.0,.86,.61),facet);gl_FragColor=vec4(tint,.025+rim*.17);}`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < 18; i++) {
      const prism = new THREE.Mesh(glassGeometry, glassMaterial);
      const scale = 8 + glassRandom() * 17;
      prism.position.set(240 + i * 390 + glassRandom() * 150, FLOOR + 190 + glassRandom() * 300, -2);
      prism.scale.set(scale * 0.65, scale * 1.45, scale * 0.65);
      prism.rotation.set(glassRandom(), glassRandom(), glassRandom());
      prism.userData.glassPrism = true;
      prism.userData.phase = glassRandom() * Math.PI * 2;
      this.glassPrisms.push(prism); this.scene.add(prism);
    }
    this.platformSprites = PLATFORMS.map((p, index) => {
      const h = p.ground ? 150 : 91;
      const map = platformTexture(Math.min(900, p.w), p.ground, index * 42 + 8);
      return this.sprite(map, p.w + 23, h, p.x + p.w / 2, p.y - h / 2 + 18, p.ground ? 3 : 4);
    });

    // Holes remain visibly dark even when there is distant ground in the painting.
    const grounds = PLATFORMS.filter(p => p.ground);
    this.pits = grounds.slice(0, -1).map((p, i) => {
      const start = p.x + p.w, end = grounds[i + 1].x;
      const pit = this.sprite(null, end - start + 3, 137, (end + start) / 2, 38, 1);
      pit.material.color.set('#231127'); return pit;
    });

    const benchMap = this.remember(benchTexture());
    this.benchSprites = BENCHES.map(b => this.sprite(benchMap, 109, 71, b.x, b.y + 29, 6));
    this.bellMaps = [this.remember(bellTexture(false)), this.remember(bellTexture(true))];
    this.bellSprites = SHRINES.map(s => this.sprite(this.bellMaps[0], 125, 165, s.x, s.y + 78, 7));
    this.npc = this.sprite(npcTexture(), 67, 88, 770, FLOOR + 39, 8);

    this.heroFrames = {
      idle: Array.from({ length: 6 }, (_, i) => this.remember(velaTexture(i, 'idle'))),
      run: Array.from({ length: 6 }, (_, i) => this.remember(velaTexture(i, 'run'))),
      jump: [this.remember(velaTexture(0, 'jump'))],
    };
    this.hero = this.sprite(this.heroFrames.idle[0], 110, 118, 635, FLOOR + 46, 16);
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#1f0d24', transparent: true, opacity: 0.42, depthWrite: false }));
    this.shadow.scale.set(27, 5, 1); this.shadow.position.set(635, FLOOR + 2, 9); this.scene.add(this.shadow);
    this.enemyMaps = { moss: this.remember(enemyTexture('moss')), fly: this.remember(enemyTexture('fly')), knight: this.remember(enemyTexture('knight')) };
    this.enemySprites = [];
    this.bossSprite = this.sprite(bossTexture(), 177, 205, 6290, FLOOR + 83, 14);
    this.bossAura = this.sprite(moteTexture(), 230, 190, 6290, FLOOR + 70, 12, 0.13);

    const diamondGeometry = new THREE.CircleGeometry(6, 5);
    const collectibleMat = new THREE.MeshBasicMaterial({ color: '#dfddbb', transparent: true, depthWrite: false });
    this.collectibleGeometry = diamondGeometry; this.collectibleMat = collectibleMat;
    this.collectibleSprites = [];
    this.moteMap = this.remember(moteTexture());
    this.foliage = [];
    const foliageMaps = [this.remember(foliageTexture(821, true)), this.remember(foliageTexture(36, true))];
    for (let i = 0; i < 23; i++) {
      const f = this.sprite(foliageMaps[i % 2], 240 + i % 3 * 25, 145 + i % 4 * 10, i * 335 - 70, 16, 24, 0.8);
      f.userData.index = i; this.foliage.push(f);
    }

    const pointCount = 150;
    const points = new Float32Array(pointCount * 3), sizes = new Float32Array(pointCount), phases = new Float32Array(pointCount);
    const r = random(5791);
    for (let i = 0; i < pointCount; i++) { points[i * 3] = r() * 2000; points[i * 3 + 1] = r() * VIEW_HEIGHT; points[i * 3 + 2] = r() * 22 - 6; sizes[i] = 2 + r() * 8; phases[i] = r() * Math.PI * 2; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(points, 3)); pg.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1)); pg.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uCam: { value: 0 }, uWidth: { value: 1280 }, uScale: { value: 1 }, uTexture: { value: this.moteMap } },
      vertexShader: `attribute float aSize;attribute float aPhase;varying float vAlpha;uniform float uTime;uniform float uCam;uniform float uWidth;uniform float uScale;void main(){vec3 p=position;p.x=uCam+mod(p.x+uTime*(3.0+aSize*.35)-uCam*.14,uWidth+100.0)-50.0;p.y+=sin(uTime*.25+aPhase)*16.0;vAlpha=.3+sin(uTime*.6+aPhase)*.2;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);gl_PointSize=aSize*uScale;}`,
      fragmentShader: `uniform sampler2D uTexture;varying float vAlpha;void main(){vec4 tex=texture2D(uTexture,gl_PointCoord);gl_FragColor=vec4(tex.rgb,tex.a*vAlpha);}`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(pg, this.particleMaterial); this.particles.frustumCulled = false; this.scene.add(this.particles);

    this.gate = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: '#dedbbd', transparent: true, opacity: 0.57 });
    for (let i = 0; i < 8; i++) {
      const pts = [];
      for (let n = 0; n <= 30; n++) pts.push(new THREE.Vector3(5487 + Math.sin(n * 0.27 + i) * (15 + i * 4), FLOOR + n * 11, 13));
      const g = new THREE.BufferGeometry().setFromPoints(pts); this.gate.add(new THREE.Line(g, lineMat));
    }
    this.scene.add(this.gate);
    this.exit = new THREE.Group();
    const archMat = new THREE.LineBasicMaterial({ color: '#c4abca', transparent: true, opacity: 0.7 });
    for (let k = 0; k < 3; k++) {
      const pts = [new THREE.Vector3(6804 - k * 7, FLOOR, 7), new THREE.Vector3(6804 - k * 7, FLOOR + 155, 7)];
      for (let i = 0; i <= 32; i++) { const a = Math.PI - i / 32 * Math.PI; pts.push(new THREE.Vector3(6874 + Math.cos(a) * (70 + k * 7), FLOOR + 155 + Math.sin(a) * (100 + k * 7), 7)); }
      pts.push(new THREE.Vector3(6944 + k * 7, FLOOR, 7));
      this.exit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), archMat));
    }
    this.scene.add(this.exit);
    this.exitGlow = this.sprite(this.moteMap, 310, 480, 6874, FLOOR + 140, 6, 0.18);

    this.effectGeometry = new THREE.PlaneGeometry(1, 1);
    this.ringGeometry = new THREE.RingGeometry(0.92, 1, 64);
    this.slashGeometry = new THREE.RingGeometry(0.82, 1, 48, 1, -Math.PI * 0.4, Math.PI * 0.8);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
    this.viewWidth = VIEW_HEIGHT * this.width / this.height;
    if (this.useCanvas) {
      this.canvas.width = Math.round(this.width * this.pixelRatio);
      this.canvas.height = Math.round(this.height * this.pixelRatio);
    } else this.webgl.setSize(this.width, this.height, false);
    this.camera.right = this.viewWidth; this.camera.updateProjectionMatrix();
    this.fog.scale.set(this.viewWidth, VIEW_HEIGHT, 1);
    for (const bg of [this.background, this.previousBg]) bg.scale.set(this.viewWidth * 1.075, VIEW_HEIGHT * 1.04, 1);
    this.particleMaterial.uniforms.uWidth.value = this.viewWidth;
    this.particleMaterial.uniforms.uScale.value = this.height / VIEW_HEIGHT * this.pixelRatio;
  }

  makeEffect(effect) {
    const group = new THREE.Group();
    group.position.set(effect.x, effect.y, 20);
    const color = ['damage'].includes(effect.type) ? '#d2695b' : ['heal', 'ring', 'collect'].includes(effect.type) ? '#e4caea' : '#f2f0de';
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    if (['ring', 'heal', 'jump', 'land', 'slam'].includes(effect.type)) {
      const mesh = new THREE.Mesh(this.ringGeometry, material); group.add(mesh);
    } else if (effect.type === 'slash') {
      const mesh = new THREE.Mesh(this.slashGeometry, material); mesh.rotation.z = effect.direction < 0 ? Math.PI : 0; group.add(mesh);
    } else if (effect.type === 'dash') {
      for (let i = 0; i < 6; i++) { const line = new THREE.Mesh(this.effectGeometry, material); line.position.set(-effect.direction * i * 16, (i % 3 - 1) * 10, 0); line.scale.set(50 + i * 7, 1.2, 1); group.add(line); }
    } else {
      for (let i = 0; i < (effect.type === 'burst' ? 21 : 10); i++) { const chip = new THREE.Mesh(this.effectGeometry, material); chip.userData.angle = i * 2.399; chip.userData.speed = 20 + (i * 31 % 85); chip.scale.set(2 + i % 3, 5 + i % 4, 1); chip.rotation.z = i; group.add(chip); }
    }
    this.scene.add(group); this.dynamicEffects.set(effect.id, { group, material, effect });
    if (effect.type === 'damage') this.shake = 7;
    if (effect.type === 'slam') this.shake = 5;
  }

  render(world, dt, time) {
    if (this.disposed) return;
    const p = world.player;
    const visual = this.reducedMotion ? 0 : time;
    const targetCam = Math.max(0, Math.min(WORLD_WIDTH - this.viewWidth, p.x - this.viewWidth * 0.46));
    world.cameraX += (targetCam - world.cameraX) * Math.min(1, dt * 5.5);
    if (Math.abs(targetCam - world.cameraX) > this.viewWidth * 1.5) world.cameraX = targetCam;
    this.shake *= Math.max(0, 1 - dt * 12);
    const shake = this.reducedMotion ? 0 : this.shake;
    this.camera.position.x = world.cameraX + Math.sin(time * 74) * shake;
    this.camera.position.y = Math.cos(time * 89) * shake * 0.4;
    for (const bg of [this.background, this.previousBg]) bg.position.set(world.cameraX + this.viewWidth / 2 - Math.sin(world.cameraX * 0.00085) * this.viewWidth * 0.028, VIEW_HEIGHT / 2 + 7, bg.position.z);
    if (world.region !== this.lastRegion && this.maps.length) {
      this.previousBg.material.map = this.background.material.map;
      this.previousBg.material.opacity = 1;
      this.background.material.map = this.maps[world.region];
      this.background.material.color.set(world.region >= 2 ? '#f0e5c9' : '#eadeed');
      this.lastRegion = world.region; this.crossfade = 0;
    }
    if (this.crossfade < 1) { this.crossfade = Math.min(1, this.crossfade + dt * 1.3); this.background.material.opacity = this.crossfade; this.previousBg.material.opacity = 1 - this.crossfade; }
    this.fog.position.set(world.cameraX + this.viewWidth / 2, VIEW_HEIGHT / 2, -8);
    this.fogMaterial.uniforms.uTime.value = visual;
    this.particleMaterial.uniforms.uTime.value = visual;
    this.particleMaterial.uniforms.uCam.value = world.cameraX;
    this.glassPrisms.forEach((prism, i) => {
      prism.rotation.y = visual * 0.09 + prism.userData.phase;
      prism.rotation.z = Math.sin(visual * 0.16 + i) * 0.12;
    });

    const pose = !p.grounded ? 'jump' : Math.abs(p.vx) > 30 ? 'run' : 'idle';
    const frame = Math.floor(visual * (pose === 'run' ? 12 : 3)) % this.heroFrames[pose].length;
    this.hero.material.map = this.heroFrames[pose][frame];
    this.hero.position.set(p.x, p.y + 46 + (pose === 'idle' ? Math.sin(visual * 2.1) * 1.3 : 0), 16);
    this.hero.scale.x = 110 * p.facing;
    this.hero.rotation.z = p.dash > 0 ? -p.facing * 0.32 : Math.max(-0.08, Math.min(0.08, -p.vx * 0.00012));
    this.hero.material.opacity = p.invulnerable > 0 && world.time > 2 && Math.sin(world.time * 30) > 0.3 ? 0.45 : 1;
    this.shadow.position.x = p.x; this.shadow.material.opacity = Math.max(0.06, 0.4 - (p.y - FLOOR) * 0.0015);
    this.shadow.visible = p.y >= FLOOR && p.y < FLOOR + 300;

    while (this.enemySprites.length < world.enemies.length) {
      const e = world.enemies[this.enemySprites.length];
      this.enemySprites.push(this.sprite(this.enemyMaps[e.kind], e.kind === 'knight' ? 91 : 102, e.kind === 'knight' ? 107 : 102, e.x, e.y + 37, 12));
    }
    world.enemies.forEach((e, i) => {
      const mesh = this.enemySprites[i]; mesh.visible = e.alive;
      mesh.position.set(e.x, e.y + (e.kind === 'knight' ? 43 : 32) + (e.kind === 'fly' ? 0 : Math.sin(visual * 5 + i) * 1.5), 12);
      mesh.scale.x = Math.abs(mesh.scale.x) * e.dir;
      mesh.rotation.z = e.kind === 'fly' ? Math.sin(visual * 13 + i) * 0.09 : Math.sin(visual * 4 + i) * 0.025;
      mesh.material.color.set(e.hit > 0 ? '#ffffff' : '#d9c1df');
      mesh.material.opacity = e.hit > 0 ? 0.55 + Math.sin(visual * 65) * 0.4 : 1;
    });
    const boss = world.boss;
    this.bossSprite.visible = boss.alive;
    this.bossSprite.position.set(boss.x, boss.y + 83, 14);
    this.bossSprite.rotation.z = boss.phase === 'windup' ? Math.sin(visual * 31) * 0.04 : boss.phase === 'charge' ? -boss.direction * 0.12 : Math.sin(visual * 1.9) * 0.02;
    this.bossSprite.scale.x = 177 * (boss.direction < 0 ? -1 : 1);
    this.bossSprite.material.color.set(boss.hit > 0 ? '#fff1d1' : boss.phase === 'windup' ? '#e6b88e' : '#ece8ce');
    this.bossAura.position.x = boss.x; this.bossAura.position.y = boss.y + 70; this.bossAura.visible = boss.alive;
    this.bossAura.material.opacity = boss.phase === 'windup' ? 0.4 : 0.1;
    this.bellSprites.forEach((mesh, i) => { mesh.material.map = this.bellMaps[world.bells[i] ? 1 : 0]; });
    this.gate.visible = !world.bells.every(Boolean);
    this.exitGlow.material.opacity = boss.alive ? 0.035 : 0.3 + Math.sin(visual) * 0.08;

    while (this.collectibleSprites.length < world.collectibles.length) {
      const gem = new THREE.Mesh(this.collectibleGeometry, this.collectibleMat); gem.rotation.z = 0.36; this.scene.add(gem); this.collectibleSprites.push(gem);
    }
    world.collectibles.forEach((gem, i) => { const mesh = this.collectibleSprites[i]; mesh.visible = !gem.taken; mesh.position.set(gem.x, gem.y + Math.sin(visual * 2.5 + i * 0.6) * 4, 11); mesh.scale.x = 0.65 + Math.abs(Math.sin(visual + i)) * 0.35; });
    this.foliage.forEach((f, i) => { f.rotation.z = Math.sin(visual * 0.42 + i) * 0.018; });

    for (const e of world.effects) if (!this.dynamicEffects.has(e.id)) this.makeEffect(e);
    const activeIds = new Set(world.effects.map(e => e.id));
    for (const [id, entry] of this.dynamicEffects) {
      const { group, material, effect: e } = entry;
      if (!activeIds.has(id)) { this.scene.remove(group); material.dispose(); this.dynamicEffects.delete(id); continue; }
      const progress = e.age / e.life;
      material.opacity = (1 - progress) * (e.type === 'ring' ? 0.65 : 0.85);
      if (['ring', 'heal', 'jump', 'land', 'slam'].includes(e.type)) {
        const radius = e.type === 'ring' ? 20 + progress * 270 : e.type === 'heal' ? 20 + progress * 40 : 10 + progress * (e.type === 'slam' ? 190 : 35);
        group.scale.set(radius, ['jump', 'land', 'slam'].includes(e.type) ? radius * 0.27 : radius, 1);
      } else if (e.type === 'slash') { const size = 39 + progress * 36; group.scale.set(size, size * 0.77, 1); }
      else if (e.type === 'dash') group.scale.x = 1 + progress;
      else group.children.forEach(chip => { const { angle, speed } = chip.userData; chip.position.set(Math.cos(angle) * speed * progress, Math.sin(angle) * speed * progress - progress * progress * 35, 0); chip.rotation.z += dt * 3; });
    }

    while (this.projectileSprites.length < world.projectiles.length) {
      const mesh = this.sprite(this.moteMap, 48, 15, 0, 0, 18); this.projectileSprites.push(mesh);
    }
    this.projectileSprites.forEach((mesh, i) => { const shot = world.projectiles[i]; mesh.visible = Boolean(shot); if (!shot) return; mesh.position.set(shot.x, shot.y, 18); mesh.scale.set(shot.hostile ? 35 : 52, shot.hostile ? 45 : 12, 1); mesh.material.color.set(shot.hostile ? '#e0b785' : '#f0dff4'); });
    if (this.useCanvas) this.renderCanvas(world, visual);
    else this.webgl.render(this.scene, this.camera);
    this.stats.frames++;
    if (this.webgl) this.stats.calls = this.webgl.info.render.calls;
  }

  // The retained Three.js scene also has a lightweight painter for browsers
  // without a hardware GPU. Physics, sprites, camera and effects stay identical.
  renderCanvas(world, time) {
    const c = this.ctx;
    const unit = this.height / VIEW_HEIGHT * this.pixelRatio;
    const cam = this.camera.position.x;
    const camY = this.camera.position.y;
    c.setTransform(unit, 0, 0, unit, 0, 0);
    c.fillStyle = '#1e1421'; c.fillRect(0, 0, this.viewWidth, VIEW_HEIGHT);
    c.imageSmoothingEnabled = true;
    this.stats.calls = 0;
    const sprites = this.scene.children.filter(obj => obj.isMesh && obj.visible && !obj.userData.glassPrism).sort((a, b) => a.position.z - b.position.z);
    const paint = mesh => {
      if (mesh === this.fog || mesh.material.opacity <= 0) return;
      const img = mesh.material.map?.image;
      const width = Math.abs(mesh.scale.x) * (mesh.geometry.parameters.width || (mesh.geometry.parameters.radius || 0.5) * 2);
      const height = Math.abs(mesh.scale.y) * (mesh.geometry.parameters.height || (mesh.geometry.parameters.radius || 0.5) * 2);
      if (mesh.position.x + width / 2 < cam - 50 || mesh.position.x - width / 2 > cam + this.viewWidth + 50) return;
      c.save();
      c.globalAlpha = mesh.material.opacity;
      c.translate(mesh.position.x - cam, VIEW_HEIGHT - mesh.position.y + camY);
      c.rotate(-mesh.rotation.z);
      c.scale(Math.sign(mesh.scale.x), 1);
      if (img && img.width && img.height) c.drawImage(img, -width / 2, -height / 2, width, height);
      else if (mesh.material.color) {
        c.fillStyle = mesh.material.color.getStyle();
        if (mesh.geometry.type === 'CircleGeometry') {
          c.beginPath();
          if (mesh === this.shadow) c.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
          else {
            for (let n = 0; n < 5; n++) { const a = n / 5 * Math.PI * 2; const x = Math.cos(a) * width / 2, y = Math.sin(a) * height / 2; if (!n) c.moveTo(x, y); else c.lineTo(x, y); }
            c.closePath();
          }
          c.fill();
          if (mesh !== this.shadow) { c.strokeStyle = '#7e5e86'; c.lineWidth = 1; c.stroke(); }
        } else c.fillRect(-width / 2, -height / 2, width, height);
      }
      c.restore(); this.stats.calls++;
    };
    sprites.filter(s => s.position.z < -8).forEach(paint);
    c.save();
    c.globalAlpha = this.reducedMotion ? 0.018 : 0.026 + Math.sin(time * 0.2) * 0.01;
    c.fillStyle = '#e7d2ec';
    for (let i = 0; i < 3; i++) {
      const x = this.viewWidth * (0.36 + i * 0.19);
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 35, 0); c.lineTo(x - 45, VIEW_HEIGHT); c.lineTo(x - 220, VIEW_HEIGHT); c.closePath(); c.fill();
    }
    c.restore();
    sprites.filter(s => s.position.z >= -8 && s.position.z < 20).forEach(paint);

    for (const group of [this.gate, this.exit]) {
      if (!group.visible) continue;
      for (const line of group.children) {
        const data = line.geometry.attributes.position.array;
        if (data[0] - cam < -200 || data[0] - cam > this.viewWidth + 200) continue;
        c.strokeStyle = line.material.color.getStyle(); c.globalAlpha = line.material.opacity; c.lineWidth = 1;
        c.beginPath();
        for (let i = 0; i < data.length; i += 3) { const x = data[i] - cam, y = VIEW_HEIGHT - data[i + 1]; if (!i) c.moveTo(x, y); else c.lineTo(x, y); }
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    for (const { group, material, effect } of this.dynamicEffects.values()) {
      if (group.position.x - cam < -300 || group.position.x - cam > this.viewWidth + 300) continue;
      c.save(); c.translate(group.position.x - cam, VIEW_HEIGHT - group.position.y); c.scale(group.scale.x, group.scale.y);
      c.globalAlpha = material.opacity; c.strokeStyle = material.color.getStyle(); c.fillStyle = c.strokeStyle;
      if (['ring', 'heal', 'jump', 'land', 'slam', 'slash'].includes(effect.type)) {
        c.lineWidth = effect.type === 'slash' ? 0.065 : 0.025;
        c.beginPath();
        if (effect.type === 'slash') { const a = effect.direction < 0 ? Math.PI : 0; c.arc(0, 0, 0.93, -Math.PI * 0.4 + a, Math.PI * 0.4 + a); }
        else c.arc(0, 0, 0.96, 0, Math.PI * 2);
        c.stroke();
      } else {
        for (const chip of group.children) { c.save(); c.translate(chip.position.x, -chip.position.y); c.rotate(-chip.rotation.z); c.fillRect(-chip.scale.x / 2, -chip.scale.y / 2, chip.scale.x, chip.scale.y); c.restore(); }
      }
      c.restore();
    }
    sprites.filter(s => s.position.z >= 20).forEach(paint);
    const pos = this.particles.geometry.attributes.position.array, sizes = this.particles.geometry.attributes.aSize.array, phases = this.particles.geometry.attributes.aPhase.array;
    const span = this.viewWidth + 100;
    for (let i = 0; i < sizes.length; i++) {
      const x = ((pos[i * 3] + time * (3 + sizes[i] * 0.35) - cam * 0.14) % span + span) % span - 50;
      const y = VIEW_HEIGHT - pos[i * 3 + 1] - Math.sin(time * 0.25 + phases[i]) * 16;
      c.globalAlpha = 0.3 + Math.sin(time * 0.6 + phases[i]) * 0.2;
      c.drawImage(this.moteMap.image, x - sizes[i] / 2, y - sizes[i] / 2, sizes[i], sizes[i]);
    }
    c.globalAlpha = 1;
  }

  dispose() {
    this.disposed = true;
    this.observer?.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.contextLost);
    const materials = new Set(), geometries = new Set();
    this.scene.traverse(obj => { if (obj.geometry) geometries.add(obj.geometry); if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m)); });
    materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose()); this.managedTextures.forEach(t => t.dispose());
    this.effectGeometry.dispose(); this.ringGeometry.dispose(); this.slashGeometry.dispose(); this.webgl?.dispose();
  }
}
