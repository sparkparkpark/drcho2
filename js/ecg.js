// ECG (heartbeat) monitor animation for the home hero (dark background)
(function () {
  const canvas = document.getElementById('ecgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED   = [214, 120, 138];   // soft cardiac red, muted for dark bg
  const BRAND = [150, 164, 224];   // logo periwinkle, lightened
  let W = 0, H = 0, traces = [];
  let rateBoost = 0; // the heart beats a little faster near the mouse
  // bpm values are visual pacing (beat spacing on screen), not a real heart rate

  // one heartbeat: P, Q, R, S, T waves as gaussians over phase 0..1
  const waves = [
    { c: 0.10, w: 0.025, a: 0.12 }, { c: 0.205, w: 0.008, a: -0.12 }, { c: 0.23, w: 0.010, a: 1.0 },
    { c: 0.255, w: 0.009, a: -0.28 }, { c: 0.46, w: 0.045, a: 0.26 }
  ];
  const beat = p => waves.reduce((y, k) => { const d = (p - k.c) / k.w; return y + k.a * Math.exp(-d * d); }, 0);

  function setup() {
    const host = canvas.parentElement, dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = host.offsetWidth; H = host.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const big = W > 900;
    traces = [
      { yc: H * 0.40, amp: H * (big ? 0.15 : 0.09), speed: big ? 0.9 : 0.65, bpm: 13.5, rgb: RED,   alpha: 0.3, width: 1.8 },
      { yc: H * 0.74, amp: H * (big ? 0.08 : 0.05), speed: big ? 0.65 : 0.45, bpm: 11, rgb: BRAND, alpha: 0.25, width: 1.3 },
      { yc: H * 0.15, amp: H * 0.05,                speed: big ? 0.45 : 0.35, bpm: 8.5, rgb: [255, 255, 255], alpha: 0.08, width: 1.1 }
    ].map((t, i) => Object.assign(t, { buf: new Float32Array(Math.ceil(W) + 2), head: 0, phase: i * 0.37, carry: 0 }));
    traces.forEach(t => step(t, Math.floor(W)));
  }

  function step(t, n) {
    const secPerPx = 1 / (t.speed * 60), N = Math.max(1, Math.floor(W));
    for (let i = 0; i < n; i++) {
      t.phase = (t.phase + secPerPx * (t.bpm + rateBoost) / 60) % 1;
      t.head = (t.head + 1) % N;
      t.buf[t.head] = beat(t.phase);
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 28) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 0; y < H; y += 28) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();
  }

  function draw(t) {
    const n = Math.floor(W), gap = 36, seg = 24, [r, g, b] = t.rgb;
    ctx.lineWidth = t.width; ctx.lineJoin = 'round';
    // short segments so the trail fades behind the sweep head
    for (let s = gap; s < n; s += seg) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${(t.alpha * Math.pow(s / n, 1.6)).toFixed(3)})`;
      ctx.beginPath();
      for (let k = 0; k <= seg && s + k < n; k++) {
        const x = (t.head + 1 + s + k) % n, y = t.yc - t.buf[x] * t.amp;
        (k === 0 || x === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // glowing sweep head
    ctx.fillStyle = `rgba(${r},${g},${b},${t.alpha})`;
    ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(t.head, t.yc - t.buf[t.head] * t.amp, t.width + 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    traces.forEach(t => {
      if (!reduce) { t.carry += t.speed; const px = Math.floor(t.carry); t.carry -= px; if (px) step(t, px); }
      draw(t);
    });
    if (!reduce) requestAnimationFrame(frame);
  }

  const host = canvas.parentElement;
  host.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    const dy = Math.abs((e.clientY - r.top) - H * 0.40) / H;
    rateBoost = Math.max(0, 8 * (1 - dy * 2.5));
  });
  host.addEventListener('mouseleave', () => { rateBoost = 0; });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { setup(); if (reduce) frame(); }, 150); });
  setup();
  frame();
})();
