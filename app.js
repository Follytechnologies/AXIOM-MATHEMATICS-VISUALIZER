'use strict';

// ─── Chalk Dust Particles ─────────────────────────────────────────────────────
(function spawnDust() {
  const container = document.getElementById('chalkDust');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'dust-particle';
    p.style.left     = Math.random() * 100 + 'vw';
    p.style.animationDuration = (8 + Math.random() * 20) + 's';
    p.style.animationDelay   = (-Math.random() * 20) + 's';
    p.style.width  = (1 + Math.random() * 2) + 'px';
    p.style.height = p.style.width;
    container.appendChild(p);
  }
})();

// ─── Tab System ───────────────────────────────────────────────────────────────
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    resizeAllCanvases();
    if (btn.dataset.tab === 'fourier') startFourier();
    if (btn.dataset.tab === 'complex') renderComplex();
    if (btn.dataset.tab === 'polar')   drawPolar();
    if (btn.dataset.tab === 'grapher') drawGrapher();
  });
});

// ─── Safe Math Expression Parser ─────────────────────────────────────────────
function safeEval(expr, vars = {}) {
  const scope = Object.assign({
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    abs: Math.abs, sqrt: Math.sqrt, log: Math.log,
    exp: Math.exp, pow: Math.pow, PI: Math.PI, E: Math.E,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    sign: Math.sign, min: Math.min, max: Math.max,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    atan2: Math.atan2,
  }, vars);

  // Preprocess: ^ → **, implicit multiply, theta → variable
  let e = expr
    .replace(/\btheta\b/g, '__theta__')
    .replace(/\^/g, '**')
    .replace(/(\d)([a-zA-Z_(])/g, '$1*$2')
    .replace(/__theta__/g, 'theta');

  try {
    const fn = new Function(...Object.keys(scope), `"use strict"; return (${e});`);
    return fn(...Object.values(scope));
  } catch {
    return NaN;
  }
}

function makeEval(expr) {
  return (vars) => safeEval(expr, vars);
}

// ─── Canvas Resize Helper ─────────────────────────────────────────────────────
function resizeCanvas(canvas) {
  const rect = canvas.parentElement.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width  = rect.width  + 'px';
  canvas.style.height = rect.height + 'px';
  canvas.getContext('2d').scale(dpr, dpr);
  return true;
}

function resizeAllCanvases() {
  ['grapherCanvas','complexCanvas','polarCanvas'].forEach(id => {
    const c = document.getElementById(id);
    if (c) resizeCanvas(c);
  });
  const fc = document.getElementById('fourierCanvas');
  const wc = document.getElementById('waveCanvas');
  if (fc && wc) {
    resizeCanvas(fc);
    resizeCanvas(wc);
  }
}

window.addEventListener('resize', () => {
  resizeAllCanvases();
  drawGrapher();
  renderComplex();
  drawPolar();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — FUNCTION GRAPHER
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = ['#7ec850','#6baed6','#d4a843','#d46b8a','#4cbfb0','#b89fe0'];

let functions = [
  { expr: 'sin(x)', color: COLORS[0] }
];

let view = { xMin: -10, xMax: 10, yMin: -6, yMax: 6 };
let isPanning = false, panStart = null, panViewStart = null;
let animFrame = null;

function getGrapherCanvas() { return document.getElementById('grapherCanvas'); }

function worldToCanvas(x, y, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  return {
    cx: (x - view.xMin) / (view.xMax - view.xMin) * w,
    cy: (1 - (y - view.yMin) / (view.yMax - view.yMin)) * h
  };
}

function canvasToWorld(cx, cy, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  return {
    x: view.xMin + (cx / w) * (view.xMax - view.xMin),
    y: view.yMin + (1 - cy / h) * (view.yMax - view.yMin)
  };
}

function drawGrapher() {
  const canvas = getGrapherCanvas();
  if (!canvas) return;
  resizeCanvas(canvas);

  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#161a0e';
  ctx.fillRect(0, 0, W, H);

  const showGrid = document.getElementById('showGrid')?.checked;
  const showAxes = document.getElementById('showAxes')?.checked;

  // Grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(46,56,32,0.8)';
    ctx.lineWidth = 1;
    const xStep = niceStep(view.xMax - view.xMin);
    const yStep = niceStep(view.yMax - view.yMin);

    for (let x = Math.ceil(view.xMin / xStep) * xStep; x <= view.xMax; x += xStep) {
      const { cx } = worldToCanvas(x, 0, canvas);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    }
    for (let y = Math.ceil(view.yMin / yStep) * yStep; y <= view.yMax; y += yStep) {
      const { cy } = worldToCanvas(0, y, canvas);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    }

    // Grid labels
    ctx.fillStyle = 'rgba(122,133,96,0.7)';
    ctx.font = `${Math.floor(canvas.clientWidth * 0.012 + 8)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    for (let x = Math.ceil(view.xMin / xStep) * xStep; x <= view.xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.1) continue;
      const { cx, cy: ay } = worldToCanvas(x, 0, canvas);
      const labelY = Math.min(H - 4, Math.max(14, ay + 14));
      ctx.fillText(+x.toFixed(2), cx, labelY);
    }
    ctx.textAlign = 'right';
    for (let y = Math.ceil(view.yMin / yStep) * yStep; y <= view.yMax; y += yStep) {
      if (Math.abs(y) < yStep * 0.1) continue;
      const { cx: ax, cy } = worldToCanvas(0, y, canvas);
      const labelX = Math.min(W - 4, Math.max(30, ax - 4));
      ctx.fillText(+y.toFixed(2), labelX, cy + 4);
    }
  }

  // Axes
  if (showAxes) {
    ctx.strokeStyle = 'rgba(184,184,154,0.5)';
    ctx.lineWidth = 1.5;
    const { cy: ay } = worldToCanvas(0, 0, canvas);
    const { cx: ax } = worldToCanvas(0, 0, canvas);
    ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, H); ctx.stroke();
    // Axis arrows
    ctx.fillStyle = 'rgba(184,184,154,0.5)';
    arrow(ctx, W - 2, ay, 'right');
    arrow(ctx, ax, 2, 'up');
  }

  // Plot functions
  functions.forEach(fn => {
    const f = makeEval(fn.expr);
    ctx.strokeStyle = fn.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = fn.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    let penDown = false;
    const steps = W * 2;
    for (let i = 0; i <= steps; i++) {
      const x = view.xMin + (i / steps) * (view.xMax - view.xMin);
      const y = f({ x });
      if (!isFinite(y) || Math.abs(y) > (view.yMax - view.yMin) * 10) {
        penDown = false; continue;
      }
      const { cx, cy } = worldToCanvas(x, y, canvas);
      if (!penDown) { ctx.moveTo(cx, cy); penDown = true; }
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
}

function arrow(ctx, x, y, dir) {
  ctx.beginPath();
  if (dir === 'right') { ctx.moveTo(x, y - 5); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 5); }
  if (dir === 'up')    { ctx.moveTo(x - 5, y); ctx.lineTo(x, y - 8); ctx.lineTo(x + 5, y); }
  ctx.fill();
}

function niceStep(range) {
  const raw = range / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  if (norm < 1.5) return mag;
  if (norm < 3.5) return 2 * mag;
  if (norm < 7.5) return 5 * mag;
  return 10 * mag;
}

// Function list UI
function renderFunctionList() {
  const list = document.getElementById('functionList');
  list.innerHTML = '';
  functions.forEach((fn, i) => {
    const row = document.createElement('div');
    row.className = 'fn-row';
    row.innerHTML = `
      <div class="fn-color-dot" style="background:${fn.color}" data-i="${i}"></div>
      <input class="fn-input" value="${fn.expr}" data-i="${i}" placeholder="f(x) = ..."/>
      <button class="fn-remove" data-i="${i}">✕</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.fn-input').forEach(inp => {
    inp.addEventListener('input', e => {
      functions[+e.target.dataset.i].expr = e.target.value;
      drawGrapher();
    });
  });
  list.querySelectorAll('.fn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      if (functions.length === 1) return;
      functions.splice(+e.target.dataset.i, 1);
      renderFunctionList();
      drawGrapher();
    });
  });
}

document.getElementById('addFnBtn').addEventListener('click', () => {
  functions.push({ expr: 'x', color: COLORS[functions.length % COLORS.length] });
  renderFunctionList();
  drawGrapher();
});

['xMin','xMax','yMin','yMax'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    view[id.replace('M','_m').replace(/([A-Z])/g, c => c.toLowerCase())] = +e.target.value;
    view.xMin = +document.getElementById('xMin').value;
    view.xMax = +document.getElementById('xMax').value;
    view.yMin = +document.getElementById('yMin').value;
    view.yMax = +document.getElementById('yMax').value;
    drawGrapher();
  });
});

document.querySelectorAll('.preset-btn[data-fn]').forEach(btn => {
  btn.addEventListener('click', () => {
    functions[0].expr = btn.dataset.fn;
    renderFunctionList();
    drawGrapher();
  });
});

['showGrid','showAxes','animateDraw'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', drawGrapher);
});

// Pan & Zoom
const gCanvas = document.getElementById('grapherCanvas');
gCanvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 1.12 : 0.88;
  const rect = gCanvas.getBoundingClientRect();
  const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top, gCanvas);
  view.xMin = x + (view.xMin - x) * factor;
  view.xMax = x + (view.xMax - x) * factor;
  view.yMin = y + (view.yMin - y) * factor;
  view.yMax = y + (view.yMax - y) * factor;
  drawGrapher();
}, { passive: false });

gCanvas.addEventListener('mousedown', e => {
  isPanning = true;
  panStart = { x: e.clientX, y: e.clientY };
  panViewStart = { ...view };
});
window.addEventListener('mousemove', e => {
  if (isPanning) {
    const W = gCanvas.clientWidth, H = gCanvas.clientHeight;
    const dx = (e.clientX - panStart.x) / W * (panViewStart.xMax - panViewStart.xMin);
    const dy = (e.clientY - panStart.y) / H * (panViewStart.yMax - panViewStart.yMin);
    view.xMin = panViewStart.xMin - dx;
    view.xMax = panViewStart.xMax - dx;
    view.yMin = panViewStart.yMin + dy;
    view.yMax = panViewStart.yMax + dy;
    drawGrapher();
  }
  // Coordinate readout
  const rect = gCanvas.getBoundingClientRect();
  if (e.clientX >= rect.left && e.clientX <= rect.right) {
    const { x, y } = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top, gCanvas);
    const el = document.getElementById('grapherCoords');
    if (el) el.textContent = `x = ${x.toFixed(3)}, y = ${y.toFixed(3)}`;
  }
});
window.addEventListener('mouseup', () => { isPanning = false; });

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — COMPLEX PLANE (Domain Coloring)
// ═══════════════════════════════════════════════════════════════════════════════

function hslToRgb(h, s, l) {
  h = ((h % 1) + 1) % 1;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if      (h < 1/6) { r = c; g = x; b = 0; }
  else if (h < 2/6) { r = x; g = c; b = 0; }
  else if (h < 3/6) { r = 0; g = c; b = x; }
  else if (h < 4/6) { r = 0; g = x; b = c; }
  else if (h < 5/6) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function renderComplex() {
  const canvas = document.getElementById('complexCanvas');
  if (!canvas || !canvas.parentElement.clientWidth) return;
  resizeCanvas(canvas);

  const W = canvas.width  / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  const ctx = canvas.getContext('2d');
  const expr = document.getElementById('complexFn').value.trim();

  // Draw axes first
  ctx.fillStyle = '#161a0e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(184,184,154,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();

  // Pixel-by-pixel domain coloring (downsampled for performance)
  const scale = 4; // pixels per sample
  const sW = Math.floor(W / scale);
  const sH = Math.floor(H / scale);
  const imgData = ctx.createImageData(W, H);
  const range = 4; // [-range, range] in complex plane

  for (let si = 0; si < sW; si++) {
    for (let sj = 0; sj < sH; sj++) {
      const re = (si / sW - 0.5) * range * 2;
      const im = (0.5 - sj / sH) * range * 2;

      // Evaluate f(z) — simplified: support z^n, 1/z, basic ops
      let fre, fim;
      try {
        const result = evalComplex(expr, re, im);
        fre = result.re;
        fim = result.im;
      } catch { fre = 0; fim = 0; }

      const mod = Math.sqrt(fre * fre + fim * fim);
      const arg = Math.atan2(fim, fre);

      const hue = (arg / (2 * Math.PI) + 0.5);
      const logMod = Math.log(mod + 1);
      const lightness = 0.5 - 0.4 * (2 / Math.PI) * Math.atan(logMod * 0.5 - 0.5);
      const saturation = 0.85;

      const [r, g, b] = isFinite(mod) ? hslToRgb(hue, saturation, Math.max(0.05, Math.min(0.95, lightness))) : [20, 20, 20];

      for (let di = 0; di < scale; di++) {
        for (let dj = 0; dj < scale; dj++) {
          const px = (si * scale + di + sj * scale * W + dj * W) * 4;
          imgData.data[px]     = r;
          imgData.data[px + 1] = g;
          imgData.data[px + 2] = b;
          imgData.data[px + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Labels
  ctx.fillStyle = 'rgba(122,133,96,0.8)';
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Re', W - 16, H / 2 - 6);
  ctx.fillText('Im', W / 2 + 16, 12);
}

function evalComplex(expr, re, im) {
  // Complex number arithmetic evaluator
  // Supports: z^n, 1/z, z+c, sin(z), exp(z), basic ops
  const z = { re, im };

  function cpow(a, n) {
    if (Number.isInteger(n) && n >= 0) {
      let r = { re: 1, im: 0 };
      for (let i = 0; i < n; i++) r = cmul(r, a);
      return r;
    }
    const mod = Math.sqrt(a.re*a.re + a.im*a.im);
    const arg = Math.atan2(a.im, a.re);
    const newMod = Math.pow(mod, n);
    const newArg = arg * n;
    return { re: newMod * Math.cos(newArg), im: newMod * Math.sin(newArg) };
  }
  function cmul(a, b) { return { re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re }; }
  function cdiv(a, b) {
    const d = b.re*b.re + b.im*b.im;
    return { re: (a.re*b.re + a.im*b.im)/d, im: (a.im*b.re - a.re*b.im)/d };
  }
  function cadd(a, b) { return { re: a.re+b.re, im: a.im+b.im }; }
  function csub(a, b) { return { re: a.re-b.re, im: a.im-b.im }; }
  function csin(a) { return { re: Math.sin(a.re)*Math.cosh(a.im), im: Math.cos(a.re)*Math.sinh(a.im) }; }
  function cexp(a) { return { re: Math.exp(a.re)*Math.cos(a.im), im: Math.exp(a.re)*Math.sin(a.im) }; }

  const e = expr.trim().replace(/\s/g, '');

  // Pattern matching for common forms
  let m;
  if (e === 'z')               return z;
  if ((m = e.match(/^z\^(\d+)$/)))   return cpow(z, +m[1]);
  if (e === '1/z')             return cdiv({re:1,im:0}, z);
  if (e === 'z^2+c')           return cadd(cpow(z,2), {re:0.285,im:0.01});
  if (e === 'sin(z)')          return csin(z);
  if (e === 'exp(z)')          return cexp(z);
  if ((m = e.match(/^z\^(\d+)\+(\d+)$/))) return cadd(cpow(z,+m[1]),{re:+m[2],im:0});
  if ((m = e.match(/^z\^(\d+)-(\d+)$/))) return csub(cpow(z,+m[1]),{re:+m[2],im:0});

  // Fallback: evaluate real part only
  return { re: safeEval(e, { x: re, z: re }), im: 0 };
}

document.getElementById('applyComplex').addEventListener('click', renderComplex);
document.getElementById('complexFn').addEventListener('keydown', e => {
  if (e.key === 'Enter') renderComplex();
});
document.querySelectorAll('.preset-btn[data-complex]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('complexFn').value = btn.dataset.complex;
    renderComplex();
  });
});

// Coordinate hover for complex
document.getElementById('complexCanvas').addEventListener('mousemove', e => {
  const canvas = document.getElementById('complexCanvas');
  const rect   = canvas.getBoundingClientRect();
  const W      = rect.width;
  const H      = rect.height;
  const re = ((e.clientX - rect.left) / W - 0.5) * 8;
  const im = (0.5 - (e.clientY - rect.top) / H) * 8;
  document.getElementById('complexCoords').textContent =
    `z = ${re.toFixed(2)} ${im >= 0 ? '+' : ''}${im.toFixed(2)}i`;
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — FOURIER SERIES
// ═══════════════════════════════════════════════════════════════════════════════

let fourierAngle = 0;
let fourierRAF   = null;
let waveHistory  = [];
let currentWave  = 'square';

function getFourierCoeffs(wave, N) {
  const coeffs = [];
  for (let n = 1; n <= N; n++) {
    let amp = 0, freq = 0, phase = 0;
    if (wave === 'square') {
      if (n % 2 === 1) { amp = 4 / (Math.PI * n); freq = n; }
    } else if (wave === 'sawtooth') {
      amp = (n % 2 === 0 ? 1 : -1) * 2 / (Math.PI * n); freq = n;
    } else if (wave === 'triangle') {
      if (n % 2 === 1) { amp = (n % 4 === 1 ? 1 : -1) * 8 / (Math.PI * Math.PI * n * n); freq = n; }
    } else if (wave === 'pulse') {
      amp = 2 * Math.sin(n * Math.PI * 0.3) / (Math.PI * n); freq = n;
    }
    if (amp !== 0) coeffs.push({ amp, freq, phase });
  }
  return coeffs;
}

function startFourier() {
  if (fourierRAF) cancelAnimationFrame(fourierRAF);
  waveHistory = [];
  fourierAngle = 0;

  const fc = document.getElementById('fourierCanvas');
  const wc = document.getElementById('waveCanvas');
  if (!fc || !wc) return;
  resizeCanvas(fc);
  resizeCanvas(wc);

  function loop() {
    const N       = +document.getElementById('termsSlider').value;
    const speed   = +document.getElementById('speedSlider').value / 50;
    const showC   = document.getElementById('showCircles').checked;
    const showP   = document.getElementById('showPath').checked;
    const coeffs  = getFourierCoeffs(currentWave, N);

    const fCtx = fc.getContext('2d');
    const wCtx = wc.getContext('2d');
    const FW = fc.clientWidth,  FH = fc.clientHeight;
    const WW = wc.clientWidth,  WH = wc.clientHeight;

    fCtx.clearRect(0, 0, FW, FH);
    wCtx.clearRect(0, 0, WW, WH);

    // Fourier canvas background
    fCtx.fillStyle = '#161a0e';
    fCtx.fillRect(0, 0, FW, FH);
    wCtx.fillStyle = '#161a0e';
    wCtx.fillRect(0, 0, WW, WH);

    // Draw rotating circles
    let x = FW / 2, y = FH / 2;

    coeffs.forEach(({ amp, freq, phase }) => {
      const r  = amp * Math.min(FW, FH) * 0.22;
      const nx = x + r * Math.cos(freq * fourierAngle + phase);
      const ny = y + r * Math.sin(freq * fourierAngle + phase);

      if (showC) {
        fCtx.beginPath();
        fCtx.arc(x, y, r, 0, Math.PI * 2);
        fCtx.strokeStyle = 'rgba(122,133,96,0.25)';
        fCtx.lineWidth = 1;
        fCtx.stroke();

        fCtx.beginPath();
        fCtx.moveTo(x, y);
        fCtx.lineTo(nx, ny);
        fCtx.strokeStyle = 'rgba(212,168,67,0.7)';
        fCtx.lineWidth = 1.5;
        fCtx.stroke();

        fCtx.beginPath();
        fCtx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        fCtx.fillStyle = '#d4a843';
        fCtx.fill();
      }

      x = nx; y = ny;
    });

    // Tip dot
    fCtx.beginPath();
    fCtx.arc(x, y, 4, 0, Math.PI * 2);
    fCtx.fillStyle = '#7ec850';
    fCtx.fill();

    // Store wave point
    waveHistory.unshift({ y: y - FH / 2 });
    if (waveHistory.length > WW) waveHistory.length = WW;

    // Draw wave
    if (showP) {
      // Connector line
      fCtx.beginPath();
      fCtx.moveTo(x, y);
      fCtx.lineTo(FW, y);
      fCtx.strokeStyle = 'rgba(126,200,80,0.3)';
      fCtx.lineWidth = 1;
      fCtx.setLineDash([4, 4]);
      fCtx.stroke();
      fCtx.setLineDash([]);

      // Wave canvas axes
      wCtx.strokeStyle = 'rgba(184,184,154,0.2)';
      wCtx.lineWidth = 1;
      wCtx.beginPath(); wCtx.moveTo(0, WH/2); wCtx.lineTo(WW, WH/2); wCtx.stroke();

      wCtx.beginPath();
      wCtx.strokeStyle = '#7ec850';
      wCtx.lineWidth = 2;
      wCtx.shadowColor = '#7ec850';
      wCtx.shadowBlur = 4;
      waveHistory.forEach(({ y: wy }, i) => {
        const cx = i;
        const cy = WH / 2 + wy;
        i === 0 ? wCtx.moveTo(cx, cy) : wCtx.lineTo(cx, cy);
      });
      wCtx.stroke();
      wCtx.shadowBlur = 0;
    }

    fourierAngle += speed;
    fourierRAF = requestAnimationFrame(loop);
  }

  loop();
}

document.getElementById('termsSlider').addEventListener('input', e => {
  document.getElementById('termsVal').textContent = e.target.value;
  waveHistory = [];
});

document.getElementById('speedSlider').addEventListener('input', e => {
  document.getElementById('speedVal').textContent = (+e.target.value / 5).toFixed(1);
});

document.querySelectorAll('.preset-btn[data-wave]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset-btn[data-wave]').forEach(b => b.classList.remove('active-preset'));
    btn.classList.add('active-preset');
    currentWave = btn.dataset.wave;
    waveHistory = [];
  });
});

['showCircles','showPath'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => { waveHistory = []; });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — POLAR CURVES
// ═══════════════════════════════════════════════════════════════════════════════

let polarProgress = 0;
let polarRAF      = null;

function drawPolar(full = false) {
  const canvas = document.getElementById('polarCanvas');
  if (!canvas || !canvas.parentElement.clientWidth) return;
  resizeCanvas(canvas);

  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cx = W / 2, cy = H / 2;
  const scale = Math.min(W, H) * 0.38;

  ctx.fillStyle = '#161a0e';
  ctx.fillRect(0, 0, W, H);

  // Polar grid
  ctx.strokeStyle = 'rgba(46,56,32,0.6)';
  ctx.lineWidth = 1;
  for (let r = 1; r <= 5; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * scale / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let a = 0; a < 12; a++) {
    const angle = (a / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * scale * 1.5, cy + Math.sin(angle) * scale * 1.5);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(184,184,154,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

  // Curve
  const exprRaw = document.getElementById('polarFn').value.trim();
  const thetaMax = +document.getElementById('thetaSlider').value * Math.PI;
  const steps = 2000;
  const maxT = full ? thetaMax : polarProgress * thetaMax;

  const f = makeEval(exprRaw);

  ctx.beginPath();
  ctx.strokeStyle = '#d46b8a';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#d46b8a';
  ctx.shadowBlur = 6;

  let first = true;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * maxT;
    const r = f({ theta, x: theta });
    if (!isFinite(r)) continue;
    const px = cx + r * Math.cos(theta) * scale / 2;
    const py = cy - r * Math.sin(theta) * scale / 2;
    first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    first = false;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function animatePolar() {
  if (polarRAF) cancelAnimationFrame(polarRAF);
  polarProgress = 0;

  function step() {
    polarProgress += 0.008;
    drawPolar(false);
    if (polarProgress < 1) {
      polarRAF = requestAnimationFrame(step);
    } else {
      drawPolar(true);
    }
  }
  step();
}

document.getElementById('applyPolar').addEventListener('click', () => {
  if (document.getElementById('animatePolar').checked) animatePolar();
  else drawPolar(true);
});

document.getElementById('polarFn').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (document.getElementById('animatePolar').checked) animatePolar();
    else drawPolar(true);
  }
});

document.getElementById('thetaSlider').addEventListener('input', e => {
  const val = +e.target.value;
  document.getElementById('thetaVal').textContent = val + 'π';
  drawPolar(true);
});

document.querySelectorAll('.preset-btn[data-polar]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('polarFn').value = btn.dataset.polar;
    if (document.getElementById('animatePolar').checked) animatePolar();
    else drawPolar(true);
  });
});

// Coordinate hover
document.getElementById('polarCanvas').addEventListener('mousemove', e => {
  const canvas = document.getElementById('polarCanvas');
  const rect = canvas.getBoundingClientRect();
  const dx = e.clientX - rect.left - rect.width / 2;
  const dy = -(e.clientY - rect.top - rect.height / 2);
  const r = Math.sqrt(dx * dx + dy * dy).toFixed(1);
  const theta = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1);
  document.getElementById('polarCoords').textContent = `r = ${r}, θ = ${theta}°`;
});

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  resizeAllCanvases();
  renderFunctionList();
  drawGrapher();
  drawPolar(true);
});