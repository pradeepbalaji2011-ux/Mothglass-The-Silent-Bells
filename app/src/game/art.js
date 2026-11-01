import * as THREE from 'three';

export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function texture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  draw(ctx, width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

const path = (c, d, fill, stroke = '#111a1b', width = 2.5) => {
  const p = new Path2D(d);
  if (fill) { c.fillStyle = fill; c.fill(p); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
};

export function velaTexture(frame=0,pose='idle') {
 return texture(260,280,c=>{const stride=pose==='run'?Math.sin(frame/6*Math.PI*2)*19:0;const flap=Math.sin(frame*1.2)*8;
  c.translate(130,126);c.strokeStyle='#594162';c.lineWidth=5;c.beginPath();c.moveTo(-12,49);c.lineTo(-21+stride,110);c.lineTo(-10+stride,113);c.moveTo(12,49);c.lineTo(21-stride,110);c.lineTo(31-stride,113);c.stroke();
  for(const side of [-1,1]){c.save();c.scale(side,1);c.fillStyle=side===1?'#ecd3ab':'#c5b5d4';c.beginPath();c.moveTo(5,-8);c.lineTo(111,25+flap);c.lineTo(76,105);c.quadraticCurveTo(25,107,4,50);c.closePath();c.fill();c.stroke();for(let j=0;j<6;j++){c.beginPath();c.moveTo(7,-4);c.lineTo(27+j*12,101-j*2);c.strokeStyle='#987a95';c.lineWidth=1.8;c.stroke();}c.fillStyle='#87708d';c.beginPath();c.arc(69,61,12,0,7);c.fill();c.restore();}
  c.fillStyle='#7b577c';c.fillRect(-13,-5,26,63);const glow=c.createRadialGradient(0,-24,2,0,-24,56);glow.addColorStop(0,'#fff6cf');glow.addColorStop(1,'#efb376');c.fillStyle=glow;c.fillRect(-26,-60,52,52);c.strokeStyle='#74556a';c.lineWidth=4;c.strokeRect(-26,-60,52,52);c.beginPath();c.moveTo(-26,-60);c.lineTo(26,-8);c.moveTo(26,-60);c.lineTo(-26,-8);c.stroke();c.beginPath();c.moveTo(-12,-60);c.quadraticCurveTo(-22,-100,-36,-88);c.moveTo(12,-60);c.quadraticCurveTo(20,-98,32,-88);c.stroke();
  c.fillStyle='#f7dfb0';c.beginPath();c.arc(43,36,11,0,7);c.fill();c.stroke();
 });
}
export function enemyTexture(kind){return texture(230,230,c=>{const fly=kind==='fly';c.translate(115,120);c.strokeStyle='#4c3557';c.lineWidth=5;for(let s of [-1,1])for(let j=0;j<3;j++){c.beginPath();c.moveTo(s*34,j*9);c.lineTo(s*(57+j*12),35+j*11);c.lineTo(s*(65+j*12),44+j*11);c.stroke();}c.fillStyle=fly?'#b89ecd':'#d2ac91';c.beginPath();c.ellipse(0,0,59,fly?37:51,0,0,7);c.fill();c.stroke();for(let j=0;j<5;j++){c.strokeStyle='#806187';c.lineWidth=2;c.beginPath();c.moveTo(-48+j*24,-34);c.lineTo(-48+j*24,34);c.stroke();}if(fly){c.fillStyle='#eadfefbb';for(let s of [-1,1]){c.beginPath();c.ellipse(s*51,-49,43,18,s*.5,0,7);c.fill();}}c.fillStyle='#f9e0aa';c.fillRect(-21,-18,42,24);c.fillStyle='#755880';c.fillRect(-13,-11,8,8);c.fillRect(5,-11,8,8);});}
export function bossTexture(){return texture(380,440,c=>{c.translate(190,230);c.strokeStyle='#523951';c.lineWidth=11;for(const s of [-1,1]){c.beginPath();c.moveTo(s*65,68);c.lineTo(s*106,153);c.lineTo(s*134,154);c.stroke();}c.fillStyle='#a992b7';c.beginPath();c.ellipse(0,0,112,126,0,0,7);c.fill();c.stroke();for(let j=0;j<6;j++){c.strokeStyle='#e4c7b5';c.lineWidth=7;c.beginPath();c.ellipse(0,-90+j*34,Math.sin((j+1)/7*Math.PI)*108,16,0,0,7);c.stroke();}c.fillStyle='#efcf9e';c.fillRect(-57,-52,114,46);c.strokeStyle='#674862';c.lineWidth=5;c.strokeRect(-57,-52,114,46);for(const s of [-1,1]){c.fillStyle='#f8e3c4';c.beginPath();c.arc(s*26,-29,13,0,7);c.fill();c.stroke();c.strokeStyle='#ab83ab';c.lineWidth=13;c.beginPath();c.moveTo(s*94,3);c.lineTo(s*151,52);c.lineTo(s*163,104);c.stroke();}c.fillStyle='#7d668d';c.fillRect(-37,-168,74,37);c.fillStyle='#eccda8';c.beginPath();c.ellipse(0,-169,46,13,0,0,7);c.fill();});}

export function platformTexture(width = 500, ground = false, seed = 42) {
  const height = ground ? 160 : 100;
  return texture(width + 30, height + 28, c => {
    const r = random(seed);
    const colors = ['#6c4676', '#845291', '#573b5e', '#9660a4', '#72487d', '#a66cb5'];
    const rock = c.createLinearGradient(0, 15, 0, height); rock.addColorStop(0, '#5d4762'); rock.addColorStop(0.3, '#3c2a41'); rock.addColorStop(1, '#221027');
    const shape = new Path2D(); shape.moveTo(14, 23); shape.lineTo(width + 12, 23); shape.bezierCurveTo(width + 22, 60, width - 38, height - 4, width - 71, height - 15); shape.quadraticCurveTo(width / 2, height + 17, 56, height - 5); shape.quadraticCurveTo(-2, 72, 14, 23); shape.closePath();
    c.fillStyle = rock; c.fill(shape); c.strokeStyle = '#26132b'; c.lineWidth = 3; c.stroke(shape);
    c.save(); c.clip(shape);
    for (let i = 0; i < width / 8; i++) {
      const x = r() * width, y = 30 + r() * height;
      c.fillStyle = ['#47314c', '#524057', '#3a293e', '#5e4863'][i % 4];
      c.beginPath(); c.ellipse(x, y, 12 + r() * 24, 5 + r() * 12, -0.2 + r() * 0.4, 0, 7); c.fill(); c.lineWidth = 1.5; c.stroke();
    }
    c.restore();
    for (let i = 0; i < width / 3; i++) {
      const x = 10 + r() * width, y = 12 + r() * 29;
      c.fillStyle = colors[Math.floor(r() * colors.length)];
      c.beginPath(); c.ellipse(x, y, 3 + r() * 9, 2 + r() * 6, r() * 4, 0, 7); c.fill();
      if (i % 4 === 0) {
        c.strokeStyle = '#905b9d'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x, 21); c.quadraticCurveTo(x + 6, 7, x + r() * 14 - 7, 2); c.stroke();
      }
    }
    for (let i = 0; i < width / 45; i++) {
      const x = 15 + r() * (width - 20), length = 20 + r() * 64;
      c.strokeStyle = '#744a7e'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 35); c.quadraticCurveTo(x + 15, length, x - 3, length + 39); c.stroke();
      for (let j = 0; j < 5; j++) {
        c.fillStyle = colors[Math.floor(r() * 4)]; c.beginPath(); c.ellipse(x + (j % 2 ? 4 : -3), 35 + j * length / 5, 3, 7, j % 2 ? -0.8 : 0.8, 0, 7); c.fill();
      }
    }
  });
}

export function bellTexture(rung = false) {
  return texture(250, 330, c => {
    c.strokeStyle = '#332137'; c.lineWidth = 9;
    path(c, 'M58 306 64 82 Q61 37 124 28 Q187 33 191 84 L196 306', null, '#38263c', 12);
    path(c, 'M60 307 67 86 Q68 44 124 36 Q180 38 183 87 L190 309', null, '#a09b70', 3);
    path(c, 'M124 30 124 75', null, '#b6af89', 4);
    const gold = c.createLinearGradient(70, 75, 164, 175); gold.addColorStop(0, rung ? '#efe4af' : '#c1b687'); gold.addColorStop(0.45, '#928d61'); gold.addColorStop(1, '#604a65');
    path(c, 'M99 91 Q124 62 149 91 Q143 126 170 156 Q124 178 79 156 Q106 123 99 91Z', gold, '#3e2c43', 4);
    path(c, 'M83 151 Q125 170 166 151 M110 97 Q109 128 95 150', null, '#dbcd8c', 3);
    path(c, 'M124 166 124 213', null, '#ded9b4', 2);
    c.beginPath(); c.arc(124, 217, 6, 0, 7); c.fillStyle = '#b3a679'; c.fill();
    path(c, 'M22 308 Q116 290 226 308 L218 323 29 323Z', '#6c4f73', '#38263c', 3);
    const r = random(123);
    for (let i = 0; i < 35; i++) {
      c.fillStyle = ['#71457c', '#8f5e9b', '#583a60'][i % 3]; c.beginPath(); c.ellipse(30 + r() * 185, 300 + r() * 18, 3 + r() * 6, 3 + r() * 5, 0, 0, 7); c.fill();
    }
    path(c, 'M63 244 Q35 203 54 175 M187 266 Q216 206 197 177', null, '#775081', 3);
    for (let i = 0; i < 9; i++) { c.fillStyle = '#855192'; c.beginPath(); c.ellipse(i % 2 ? 202 : 48, 195 + i * 8, 5, 11, i % 2 ? 0.7 : -0.8, 0, 7); c.fill(); }
  });
}

export function benchTexture() {
  return texture(230, 150, c => {
    path(c, 'M41 96 34 136 M181 95 193 137', null, '#2a202c', 7);
    path(c, 'M44 43 43 96 M182 43 182 97', null, '#b7b49a', 4);
    path(c, 'M45 49 Q115 20 179 49 L178 78 Q118 54 47 78Z', '#605264', '#332137', 3);
    path(c, 'M28 88 Q115 67 201 88 L194 103 Q111 87 35 104Z', '#8d7792', '#39263e', 4);
    path(c, 'M53 58 Q112 37 172 58 M57 69 Q113 51 168 69', null, '#a389aa', 2);
    path(c, 'M28 87 Q9 72 19 62 Q32 56 37 68 M201 87 Q219 72 207 62 Q197 57 191 69', null, '#afaf91', 4);
  });
}

export function npcTexture() {
  return texture(190, 250, c => {
    path(c, 'M82 189 68 231 M116 189 128 231', null, '#342837', 4);
    path(c, 'M58 98 Q91 78 126 100 L151 192 Q103 212 43 191Z', '#715179', '#332437', 4);
    path(c, 'M76 119 Q57 153 60 189 M112 119 Q133 160 131 194', null, '#a4a16c', 3);
    path(c, 'M64 65 Q69 34 100 37 Q135 43 133 78 L121 103 Q91 119 67 100Z', '#c1a5c8', '#3e3441', 3);
    path(c, 'M57 65 Q82 7 134 42 L145 73 Q100 56 49 78Z', '#63476a', '#37293b', 4);
    c.fillStyle = '#38283c'; c.beginPath(); c.ellipse(89, 85, 4, 7, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(116, 82, 4, 7, 0, 0, 7); c.fill();
    path(c, 'M158 237 157 100 Q159 79 168 85', null, '#8e8e68', 4);
    path(c, 'M124 147 156 158', null, '#423146', 5);
  });
}

export function foliageTexture(seed = 44, dark = false) {
  return texture(500, 340, c => {
    const r = random(seed);
    for (let i = 0; i < 37; i++) {
      const x = r() * 500, h = 30 + r() * 230, spread = (r() - 0.5) * 150;
      const color = dark ? ['#1d0c21', '#26102b', '#210d26'][i % 3] : ['#45294c', '#56385e', '#70497a'][i % 3];
      c.strokeStyle = color; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, 340); c.quadraticCurveTo(x + spread * 0.35, 340 - h * 0.6, x + spread, 340 - h); c.stroke();
      for (let j = 0; j < 7; j++) {
        const y = 340 - j * h / 8;
        c.fillStyle = color; c.beginPath(); c.ellipse(x + spread * j / 8 + (j % 2 ? 8 : -8), y, 6 + r() * 11, 15 + r() * 17, j % 2 ? -0.9 : 0.9, 0, 7); c.fill();
      }
    }
  });
}

export function moteTexture() {
  return texture(64, 64, c => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 30);
    g.addColorStop(0, '#fffbe4'); g.addColorStop(0.12, '#ecd8f1aa'); g.addColorStop(0.35, '#dab1e433'); g.addColorStop(1, '#c17ed200');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
}
